from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from PIL import Image
import numpy as np
from typing import Dict, Tuple
import base64
import io

# Optional classification stub (rule-based for now)
def classify_skin_condition(skin_conditions: Dict[str, float]) -> str:
    """Optionally classify skin condition type."""
    # Simple rule-based classification by average severity
    avg = np.mean(list(skin_conditions.values()))
    if avg > 60:
        return 'Oily/Sensitive Skin'
    elif avg > 30:
        return 'Combination Skin'
    else:
        return 'Normal/Dry Skin'


def generate_charts(
    skin_conditions: Dict[str, float],
    pollution_score: float,
    skin_score: float
) -> plt.Figure:
    """Generate Matplotlib figure with donut and bar charts."""
    fig = plt.figure(figsize=(8, 10))
    # Grid layout: 3 rows (donut, pollution, conditions)
    gs = fig.add_gridspec(3, 1, height_ratios=[1, 0.5, 1.5])

    # 1) Donut chart for skin score
    ax0 = fig.add_subplot(gs[0, 0])
    remaining = 100 - skin_score
    wedges, texts, autotexts = ax0.pie(
        [skin_score, remaining],
        labels=['Score', 'Remaining'],
        colors=['#2E86C1', '#ECF0F1'],
        autopct='%1.1f%%',
        startangle=90,
        wedgeprops={'width': 0.4}
    )
    ax0.set_title('Overall Skin Score', fontsize=14, fontweight='bold')
    ax0.text(0, 0, f"{skin_score:.0f}", ha='center', va='center', fontsize=20, weight='bold')

    # 2) Pollution impact bar
    ax1 = fig.add_subplot(gs[1, 0])
    ax1.barh(['Pollution Impact'], [pollution_score], color='#E67E22')
    ax1.set_xlim(0, 100)
    ax1.set_xlabel('Impact (%)')
    ax1.set_title('Pollution Impact Score', fontsize=12)
    for bar in ax1.patches:
        width = bar.get_width()
        ax1.text(width + 1, bar.get_y() + bar.get_height()/2,
                 f'{width:.1f}%', va='center')

    # 3) Skin conditions bar chart
    ax2 = fig.add_subplot(gs[2, 0])
    conditions = list(skin_conditions.keys())
    values = list(skin_conditions.values())
    bars = ax2.bar(conditions, values, color='#27AE60')
    ax2.set_ylim(0, 100)
    ax2.set_ylabel('Severity (%)')
    ax2.set_title('Skin Condition Analysis', fontsize=12)
    plt.setp(ax2.get_xticklabels(), rotation=45, ha='right')
    for bar in bars:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2, h + 1,
                 f'{h:.1f}%', ha='center')

    fig.tight_layout(pad=2)
    return fig


def assemble_report(
    image_path: str,
    skin_conditions: Dict[str, float],
    pollution_score: float,
    skin_score: float
) -> plt.Figure:
    """Assemble a full report figure including the face image and charts."""
    # Classification (optional)
    skin_type = classify_skin_condition(skin_conditions)

    # Create main figure
    fig = plt.figure(figsize=(8, 12))
    gs_main = fig.add_gridspec(4, 1, height_ratios=[2, 1, 0.5, 1.5])

    # 1) Face image
    ax_img = fig.add_subplot(gs_main[0, 0])
    img = Image.open(image_path)
    ax_img.imshow(img)
    ax_img.axis('off')
    ax_img.set_title('Face Analysis', fontsize=16, weight='bold')

    # 2) Charts placeholder
    # Use generate_charts to construct sub-figure and copy into main figure
    charts_fig = generate_charts(skin_conditions, pollution_score, skin_score)
    # Draw charts_fig to canvas
    charts_fig.canvas.draw()
    buf = io.BytesIO()
    charts_fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    chart_img = Image.open(buf)

    ax_chart = fig.add_subplot(gs_main[1:, 0])
    ax_chart.imshow(chart_img)
    ax_chart.axis('off')

    # 3) Skin type classification text
    ax_text = fig.add_subplot(gs_main[2, 0])
    ax_text.axis('off')
    ax_text.text(0, 0.5, f'Suggested Skin Type: {skin_type}', fontsize=12, weight='bold')

    # Timestamp
    fig.suptitle(f'Report generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
                 fontsize=8, x=0.5, y=0.02)

    fig.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.close(charts_fig)
    return fig


def save_pdf_report(fig: plt.Figure, output_path: str):
    """Save the report figure as a PDF file."""
    with PdfPages(output_path) as pdf:
        pdf.savefig(fig, bbox_inches='tight')


def save_html_report(fig: plt.Figure, output_path: str):
    """Save the report as a standalone HTML file with embedded image."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    html = f'''<!DOCTYPE html>
<html><head><title>Skin Analysis Report</title></head><body>
<h1>Skin Analysis Report</h1>
<img src="data:image/png;base64,{img_base64}" style="width:100%;height:auto;"/>
</body></html>'''
    with open(output_path, 'w') as f:
        f.write(html)


# Example usage with fake data
if __name__ == '__main__':
    # Fake data
    conditions = {'Acne': 10, 'Pores': 30, 'Oiliness': 50, 'Pigmentation': 20, 'Dark Circles': 40, 'Wrinkles': 15}
    pollution = 65.0
    skin_score = 70.0
    # Placeholder image (create a blank RGB image)
    img = Image.new('RGB', (400, 400), color=(200, 180, 160))
    img_path = 'placeholder_face.png'
    img.save(img_path)

    # Assemble and save
    report_fig = assemble_report(img_path, conditions, pollution, skin_score)
    save_pdf_report(report_fig, 'skin_report.pdf')
    save_html_report(report_fig, 'skin_report.html')
    print('Reports generated: skin_report.pdf, skin_report.html') 