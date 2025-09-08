import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from analyzer.skin_analyzer import SkinAnalyzer
from analyzer.pollution_analyzer import PollutionAnalyzer
from analyzer.skin_report_generator import SkinReportGenerator
import tempfile
from datetime import datetime
import json
import cv2
import numpy as np
import requests
from typing import List, Dict
from PIL import Image
import json as pyjson
import hmac
import hashlib

load_dotenv()
app = Flask(__name__, template_folder='template', static_folder='static')
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# # Initialize Supabase client
# supabase: Client = create_client(
#     os.getenv('SUPABASE_URL'),
#     os.getenv('SUPABASE_KEY')
# )

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize components
skin_analyzer = SkinAnalyzer()
pollution_analyzer = PollutionAnalyzer(os.getenv('1750030828c7204e4c73d2305ed627e1'))
report_generator = SkinReportGenerator()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get user inputs
        skin_tone = request.form.get('skin_tone', 'Medium')
        location = request.form.get('location', '')
        
        # Analyze skin
        skin_analysis = skin_analyzer.analyze_face(filepath)
        
        # Get pollution data
        pollution_data = pollution_analyzer.get_pollution_data(location)
        pollution_score = pollution_analyzer.calculate_pollution_score(pollution_data)
        
        # Get recommendations with age information
        recommendations = pollution_analyzer.get_recommendations(
            pollution_score,
            skin_tone,
            skin_analysis['conditions'],
            skin_analysis['age_analysis']['actual_age']
        )
        
        # Generate report
        report_filename = report_generator.generate_report(
            filepath,
            skin_analysis,
            pollution_data,
            pollution_score,
            recommendations
        )
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'skin_analysis': skin_analysis,
            'pollution_data': pollution_data,
            'pollution_score': pollution_score,
            'recommendations': recommendations,
            'report_url': f'/report/{report_filename}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/report/<filename>')
def get_report(filename):
    try:
        return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    except Exception as e:
        return jsonify({'error': str(e)}), 404

def classify_skin_tone(self, image: np.ndarray) -> str:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel = lab[:,:,0]
    b_channel = lab[:,:,2]
    ita_angle = (np.arctan((l_channel - 50) / b_channel) * 180 / np.pi)
    return self._classify_tone_by_ita(ita_angle)

def get_uv_recommendations(self, skin_tone: str) -> str:
    risk_levels = {
        "Very Light": "Very High UV sensitivity — Use SPF 50+ daily",
        "Light": "High UV sensitivity — Use SPF 50",
        "Intermediate": "Moderate UV sensitivity — Use SPF 30-50",
        "Tan": "Moderate UV sensitivity — Use SPF 30+",
        "Brown": "Lower UV sensitivity — Still need SPF 30",
        "Dark": "Lowest UV sensitivity — But sunscreen is still necessary!"
    }
    return risk_levels.get(skin_tone, "Unknown risk — default to SPF 30")

def assess_pigmentation_risk(self, skin_tone: str) -> str:
    if skin_tone in ["Tan", "Brown", "Dark"]:
        return "Higher risk of hyperpigmentation — avoid strong peels or lasers without doctor advice"
    else:
        return "Lower risk — but sun protection still very important"

# -------- GlowShield Clash Analysis (AI/OCR-backed) ---------

OCR_SPACE_API_KEY = os.getenv('OCR_SPACE_API_KEY') or 'helloworld'

def _compress_image_for_ocr(src_path: str) -> str:
    """Compress image to a reasonable size for OCR APIs and return temp path."""
    tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
    try:
        with Image.open(src_path) as img:
            img = img.convert('RGB')
            max_dim = 1600
            w, h = img.size
            scale = min(1.0, float(max_dim) / float(max(w, h)))
            if scale < 1.0:
                img = img.resize((int(w * scale), int(h * scale)))
            img.save(tmp_out, format='JPEG', quality=80, optimize=True)
    except Exception:
        # Fallback: just copy original
        with open(src_path, 'rb') as rf, open(tmp_out, 'wb') as wf:
            wf.write(rf.read())
    return tmp_out

def ocr_image_via_ocr_space(file_path: str) -> str:
    """
    Use OCR.space API to extract text from an image. Returns raw text.
    """
    if not OCR_SPACE_API_KEY:
        raise RuntimeError('OCR_SPACE_API_KEY is not set')
    # Compress first to increase OCR chances
    comp_path = _compress_image_for_ocr(file_path)
    with open(comp_path, 'rb') as f:
        resp = requests.post(
            'https://api.ocr.space/parse/image',
            data={'apikey': OCR_SPACE_API_KEY, 'language': 'eng', 'OCREngine': 2},
            files={'file': f}
        )
    try:
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return ''
    if data.get('IsErroredOnProcessing'):
        # OCR.space specific error; return empty to allow graceful fallback
        return ''
    if not data.get('ParsedResults'):
        return ''
    return ' '.join(r.get('ParsedText', '') for r in data['ParsedResults'])

def extract_ingredients_from_text(text: str) -> List[str]:
    """Very naive ingredient extraction from OCR text; split on commas/line breaks and normalize."""
    if not text:
        return []
    lowered = text.lower().replace('\n', ',')
    parts = [p.strip(' .:;\t') for p in lowered.split(',') if p.strip()]
    # Keep only plausible alphanumeric words/phrases
    results = []
    for p in parts:
        if 2 <= len(p) <= 60 and any(c.isalpha() for c in p):
            results.append(p)
    return results[:100]

def load_server_compatibility_map() -> Dict[str, dict]:
    """Expanded compatibility dataset. In production load from DB."""
    return {
        'vitamin c': {
            'incompatible': ['retinol', 'aha', 'bha', 'benzoyl peroxide'],
            'suggestion': 'Use Vitamin C in AM with SPF; separate from retinoids by 12 hours.',
            'alternatives': ['niacinamide serum AM', 'peptide serum PM']
        },
        'retinol': {
            'incompatible': ['aha', 'bha', 'vitamin c', 'benzoyl peroxide'],
            'suggestion': 'Use retinol at night with moisturizer; avoid acids same night.',
            'alternatives': ['bakuchiol (gentler)', 'encapsulated retinal']
        },
        'aha': {
            'incompatible': ['retinol', 'benzoyl peroxide'],
            'suggestion': 'Limit AHA to 2-3x/week; don’t pair with retinoids same night.',
            'alternatives': ['PHA (gentler acid)', 'enzyme exfoliant']
        },
        'bha': {
            'incompatible': ['retinol', 'benzoyl peroxide'],
            'suggestion': 'Use BHA for congestion; avoid pairing with retinoids same night.',
            'alternatives': ['azelaic acid 10%', 'niacinamide 4-10%']
        },
        'benzoyl peroxide': {
            'incompatible': ['retinol', 'vitamin c', 'aha', 'bha'],
            'suggestion': 'Use BP as spot or short-contact; avoid with antioxidants/acids same routine.',
            'alternatives': ['clindamycin (RX)', 'sulfur 3-10%']
        },
        'niacinamide': {
            'incompatible': [],
            'suggestion': 'Pairs well broadly; AM/PM safe; support barrier and oil control.',
            'alternatives': ['green tea extract', 'zinc PCA']
        },
        'hyaluronic acid': {
            'incompatible': [],
            'suggestion': 'Apply on damp skin, seal with moisturizer.',
            'alternatives': ['beta-glucan', 'glycerin']
        },
        'azelaic acid': {
            'incompatible': ['strong acids same night'],
            'suggestion': 'Good for redness and pigment; use with sunscreen.',
            'alternatives': ['niacinamide', 'tranexamic acid']
        }
    }

def skin_type_tip(skin_type: str) -> str:
    tips = {
        'Oily': 'Prefer gel textures; avoid heavy oils; use non-comedogenic SPF.',
        'Dry': 'Layer humectant + occlusive; avoid over-exfoliation; use richer creams.',
        'Combination': 'Treat T-zone with lighter actives; nourish cheeks more.',
        'Sensitive': 'Introduce one active at a time; patch test; avoid fragrance.'
    }
    return tips.get(skin_type, 'Patch test new products; introduce slowly.')

def analyze_compatibility(ings1: List[str], ings2: List[str]) -> dict:
    comp = load_server_compatibility_map()
    has_clash = False
    pairs = []
    suggestion = ''
    alternatives: List[str] = []
    for a in ings1:
        na = a.lower()
        for b in ings2:
            nb = b.lower()
            if na in comp and nb in comp[na]['incompatible']:
                has_clash = True
                pairs.append(f"{na} x {nb}")
                suggestion = comp[na]['suggestion']
                alternatives = comp[na]['alternatives']
            if nb in comp and na in comp[nb]['incompatible']:
                has_clash = True
                pairs.append(f"{nb} x {na}")
                suggestion = comp[nb]['suggestion']
                alternatives = comp[nb]['alternatives']
    return {
        'has_clash': has_clash,
        'pairs': list(dict.fromkeys(pairs)),
        'suggestion': suggestion,
        'alternatives': alternatives
    }

def fetch_alternative_products(skin_type: str) -> List[dict]:
    """Optionally return recommended products from Supabase by skin type."""
    try:
        products_response = supabase.table('products').select('*').filter(
            'skin_types', 'cs', f"{{{skin_type}}}"
        ).execute()
        if getattr(products_response, 'error', None):
            return []
        return products_response.data or []
    except Exception:
        return []

@app.route('/api/clash/analyze', methods=['POST'])
def clash_analyze():
    try:
        skin_type = request.form.get('skinType') or request.json.get('skinType') if request.is_json else None
        file1 = request.files.get('product1') if 'product1' in request.files else None
        file2 = request.files.get('product2') if 'product2' in request.files else None
        if not skin_type:
            return jsonify({'error': 'skinType required'}), 400
        if not file1 or not file2:
            return jsonify({'error': 'Two product images required'}), 400

        # Save temp files
        tmp1 = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        tmp2 = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        file1.save(tmp1.name)
        file2.save(tmp2.name)

        # OCR both images
        text1 = ocr_image_via_ocr_space(tmp1.name)
        text2 = ocr_image_via_ocr_space(tmp2.name)

        ings1 = extract_ingredients_from_text(text1)
        ings2 = extract_ingredients_from_text(text2)

        # Analyze compatibility
        result = analyze_compatibility(ings1, ings2)

        # Tips and optional product recommendations
        tip = skin_type_tip(skin_type)
        recommendations = fetch_alternative_products(skin_type) if result['has_clash'] else []

        return jsonify({
            'success': True,
            'ingredients': {
                'product1': ings1,
                'product2': ings2
            },
            'verdict': 'clash' if result['has_clash'] else 'safe',
            'pairs': result['pairs'],
            'advice': result['suggestion'] or tip,
            'skinTip': tip,
            'alternatives': result['alternatives'],
            'recommendedProducts': recommendations
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Gamification Endpoints
@app.route('/api/gamification/quests', methods=['GET'])
def get_daily_quests():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get user's daily quests from Supabase
        response = supabase.table('users').select('daily_quests').eq('id', user_id).single()
        
        if response.error:
            return jsonify({'error': str(response.error)}), 500

        return jsonify({
            'success': True,
            'quests': response.data.get('daily_quests', [])
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gamification/complete-quest', methods=['POST'])
def complete_quest():
    try:
        data = request.json
        user_id = data.get('user_id')
        quest_id = data.get('quest_id')

        if not user_id or not quest_id:
            return jsonify({'error': 'User ID and Quest ID required'}), 400

        # Update quest completion in Supabase
        response = supabase.table('users').update({
            'daily_quests': supabase.raw(f"array_append(daily_quests, {quest_id})")
        }).eq('id', user_id)

        if response.error:
            return jsonify({'error': str(response.error)}), 500

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gamification/streak', methods=['GET'])
def get_streak():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get user's streak from Supabase
        response = supabase.table('users').select('streak').eq('id', user_id).single()
        
        if response.error:
            return jsonify({'error': str(response.error)}), 500

        return jsonify({
            'success': True,
            'streak': response.data.get('streak', 0)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Product DNA Endpoints
@app.route('/api/products/recommendations', methods=['GET'])
def get_product_recommendations():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get user profile and product recommendations from Supabase
        response = supabase.table('users').select('skin_type, concerns').eq('id', user_id).single()
        
        if response.error:
            return jsonify({'error': str(response.error)}), 500

        # Get matching products
        products_response = supabase.table('products').select('*').filter(
            'skin_types', 'cs', f"{{{response.data['skin_type']}}}"
        ).execute()

        if products_response.error:
            return jsonify({'error': str(products_response.error)}), 500

        return jsonify({
            'success': True,
            'products': products_response.data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GlowMind Endpoints
@app.route('/api/glowmind/mood', methods=['POST'])
def log_mood():
    try:
        data = request.json
        user_id = data.get('user_id')
        mood = data.get('mood')
        stress = data.get('stress')

        if not all([user_id, mood, stress]):
            return jsonify({'error': 'User ID, mood, and stress level required'}), 400

        # Save mood entry to Supabase
        response = supabase.table('mood_logs').insert({
            'user_id': user_id,
            'mood': mood,
            'stress': stress,
            'timestamp': datetime.utcnow().isoformat()
        }).execute()

        if response.error:
            return jsonify({'error': str(response.error)}), 500

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/glowmind/correlations', methods=['GET'])
def get_correlations():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get mood and skin condition history from Supabase
        mood_response = supabase.table('mood_logs').select('*').eq('user_id', user_id).order('timestamp', desc=True).limit(30).execute()
        skin_response = supabase.table('skin_logs').select('*').eq('user_id', user_id).order('timestamp', desc=True).limit(30).execute()

        if mood_response.error or skin_response.error:
            return jsonify({'error': 'Error fetching data'}), 500

        # Calculate correlations
        correlations = calculate_correlations(mood_response.data, skin_response.data)

        return jsonify({
            'success': True,
            'correlations': correlations
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_correlations(mood_data, skin_data):
    # Implement correlation calculation logic here
    return [
        {
            'type': 'stress_acne',
            'correlation': 0.7,
            'message': 'When stress increases, acne tends to worsen'
        }
    ]

# Skin Twin Chat Endpoints
@app.route('/api/skin-twin/find', methods=['POST'])
def find_skin_twin():
    try:
        data = request.json
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400

        # Get user profile from Supabase
        user_response = supabase.table('users').select('*').eq('id', user_id).single()
        
        if user_response.error:
            return jsonify({'error': str(user_response.error)}), 500

        # Find potential skin twins
        twins_response = supabase.table('users').select('*').neq('id', user_id).execute()
        
        if twins_response.error:
            return jsonify({'error': str(twins_response.error)}), 500

        # Calculate match scores and find best match
        best_match = find_best_match(user_response.data, twins_response.data)

        return jsonify({
            'success': True,
            'twin': best_match
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def find_best_match(user_profile, potential_twins):
    # Implement matching logic here
    return {
        'id': '123',
        'name': 'Sarah',
        'match_score': 0.85
    }

# ----------------- AI Dermatologist (Google GenAI) -----------------
@app.route('/api/ai-derm/chat', methods=['POST'])
def ai_derm_chat():
    try:
        data = request.json or {}
        user_profile = data.get('profile') or {}
        messages = data.get('messages') or []  # [{role:'user'|'assistant', content:'...'}]
        user_name = user_profile.get('name', '').strip() or 'Glow Seeker'

        # Greeting detection
        GREETINGS = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"]
        def is_greeting(msg):
            msg = msg.lower().strip()
            return any(g in msg for g in GREETINGS)

        if messages and len(messages) == 1 and messages[0].get('role') == 'user' and is_greeting(messages[0].get('content', '')):
            # Time-based greeting
            now = datetime.now()
            hour = now.hour
            if 5 <= hour < 12:
                tod = "Morning"
            elif 12 <= hour < 17:
                tod = "Afternoon"
            elif 17 <= hour < 21:
                tod = "Evening"
            else:
                tod = "Night"
            day = now.strftime('%A')
            greeting = f"Good {tod}, {user_name}! Happy {day}! 🌞\n\nHow can I help you today?"
            return jsonify({"success": True, "reply": {"type": "answer", "text": greeting}})

        gapi_key = os.getenv('GOOGLE_API_KEY') or os.getenv('GOOGLE_API_KEY_AI')
        if not gapi_key:
            return jsonify({'error': 'GOOGLE_API_KEY not set'}), 400

        # Build system prompt to drive triage/question-first behavior and structured output
        system_prompt = (
            "You are an AI Dermatologist assistant. First ask concise, high-yield triage questions to clarify the user's goal, skin type, concerns, routines, and constraints. "
            "Always be empathetic and evidence-based. Use simple language. Avoid diagnosing diseases. If medical urgency signs, advise seeing a dermatologist. "
            "Return responses as JSON with keys: type ('question'|'answer'), text (string), options (array of strings, optional), plan (optional with steps), cautions (optional)."
        )

        # Convert history into Google format
        contents = [{"role": "system", "parts": [{"text": system_prompt}]}]
        for m in messages:
            role = 'user' if m.get('role') == 'user' else 'model'
            contents.append({"role": role, "parts": [{"text": m.get('content','')}]})

        # Call Google Generative AI (REST) - Gemini-pro
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {"contents": contents}
        resp = requests.post(f"{url}?key={gapi_key}", headers=headers, data=pyjson.dumps(payload), timeout=30)
        resp.raise_for_status()
        out = resp.json()
        text = out.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

        # Try to parse structured JSON from the model; if not parseable, wrap in default
        try:
            parsed = pyjson.loads(text)
        except Exception:
            parsed = {"type": "answer", "text": text}

        return jsonify({"success": True, "reply": parsed})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------- Payments: Razorpay -----------------
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

@app.route('/api/payments/config', methods=['GET'])
def payments_config():
    if not RAZORPAY_KEY_ID:
        return jsonify({'error': 'Razorpay key not configured'}), 500
    return jsonify({'key_id': RAZORPAY_KEY_ID})

@app.route('/api/payments/create-order', methods=['POST'])
def payments_create_order():
    try:
        data = request.json or {}
        amount = int(data.get('amount', 0))  # in paise
        currency = data.get('currency', 'INR')
        if amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        if not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
            return jsonify({'error': 'Razorpay not configured'}), 500

        order_payload = {
            'amount': amount,
            'currency': currency,
            'receipt': data.get('receipt', f'receipt_{int(__import__("time").time())}'),
            'notes': data.get('notes', {})
        }

        r = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            headers={'Content-Type': 'application/json'},
            data=pyjson.dumps(order_payload),
            timeout=15
        )
        r.raise_for_status()
        return jsonify({'success': True, 'order': r.json()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/verify', methods=['POST'])
def payments_verify():
    try:
        data = request.json or {}
        order_id = data.get('razorpay_order_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')
        if not all([order_id, payment_id, signature]):
            return jsonify({'error': 'Missing verification fields'}), 400
        if not RAZORPAY_KEY_SECRET:
            return jsonify({'error': 'Razorpay not configured'}), 500

        payload = f"{order_id}|{payment_id}".encode()
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()
        verified = hmac.compare_digest(expected, signature)
        return jsonify({'success': True, 'verified': bool(verified)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 