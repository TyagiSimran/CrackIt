from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from io import BytesIO
from datetime import datetime
import os

# Premium Color Palette
PRIMARY = colors.HexColor("#6366F1")  # Indigo 500
BG_DARK = colors.HexColor("#0F172A")  # Slate 900
TEXT_MAIN = colors.HexColor("#FFFFFF")
TEXT_DIM = colors.HexColor("#94A3B8")
ACCENT_CYAN = colors.HexColor("#22D3EE")
ACCENT_GREEN = colors.HexColor("#10B981")

# Use absolute path to ensure reliability across environments
STATIC_LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "static", "logo.png")

def add_header(c, width, height, title):
    """Add a premium header with logo and title."""
    # Header Background
    c.setFillColor(BG_DARK)
    c.rect(0, height - 1.5*inch, width, 1.5*inch, stroke=0, fill=1)
    
    # Logo
    if os.path.exists(STATIC_LOGO_PATH):
        try:
            # Mask auto helps with transparent PNGs
            c.drawImage(STATIC_LOGO_PATH, 0.5*inch, height - 1.25*inch, width=0.8*inch, height=0.8*inch, mask='auto', preserveAspectRatio=True)
        except Exception as e:
            print(f"Logo error: {e}")
    
    # Title
    c.setFillColor(TEXT_MAIN)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(1.5*inch, height - 1*inch, "CrackIt")
    c.setFont("Helvetica", 11)
    c.setFillColor(ACCENT_CYAN)
    c.drawString(1.5*inch, height - 1.25*inch, title.upper())
    
    # Date
    c.setFillColor(TEXT_DIM)
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 0.5*inch, height - 0.5*inch, f"Generated: {datetime.now().strftime('%b %d, %Y')}")

def draw_bar_chart(c, x, y, labels, values, chart_width=4*inch, chart_height=1.5*inch):
    """Draw a professional bar chart using canvas primitives."""
    if not values: return 0
    
    max_val = 10 
    bar_width = chart_width / (max(len(values), 1) * 1.5)
    
    # Axis
    c.setStrokeColor(TEXT_DIM)
    c.setLineWidth(0.5)
    c.line(x, y, x + chart_width, y)
    
    for i, (label, val) in enumerate(zip(labels, values)):
        bx = x + (i * bar_width * 1.5) + 0.2*inch
        bh = (val / max_val) * chart_height
        
        # Bar
        c.setFillColor(PRIMARY)
        c.roundRect(bx, y, bar_width, bh, 2, stroke=0, fill=1)
        
        # Label below
        c.setFillColor(BG_DARK)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(bx + bar_width/2, y - 0.15*inch, str(label)[:12])
        
        # Value on top
        c.setFillColor(PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(bx + bar_width/2, y + bh + 0.05*inch, str(round(val, 1)))
        
    return chart_height + 0.5*inch

def generate_interview_report_pdf(session_data, responses_data, user_name):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    add_header(c, width, height, "Interview Session Detailed Performance")
    
    # Overview Panel
    y = height - 2*inch
    c.setStrokeColor(colors.lightgrey)
    c.setLineWidth(1)
    c.roundRect(0.5*inch, y - 1*inch, width - 1*inch, 1*inch, 10, stroke=1, fill=0)
    
    c.setFillColor(BG_DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.8*inch, y - 0.35*inch, f"Candidate: {user_name}")
    c.setFont("Helvetica", 10)
    c.drawString(0.8*inch, y - 0.65*inch, f"Type: {session_data.get('interview_type', 'N/A')} | Difficulty: {session_data.get('difficulty', 'N/A')}")
    
    # Final Score Circle
    score = session_data.get('overall_score', 0)
    c.setFillColor(PRIMARY)
    c.circle(width - 1.2*inch, y - 0.5*inch, 0.35*inch, fill=1, stroke=0)
    c.setFillColor(TEXT_MAIN)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width - 1.2*inch, y - 0.55*inch, str(score))
    
    # Detailed Q&A Section
    y -= 1.35*inch
    c.setFillColor(BG_DARK)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.5*inch, y, "Full Interview Log")
    y -= 0.35*inch

    for res in responses_data:
        if y < 2*inch: # New page logic
            c.showPage()
            add_header(c, width, height, "Interview Session (Continued)")
            y = height - 2*inch

        # Question Box
        box_h = 1.7*inch
        c.setStrokeColor(colors.lightgrey)
        c.roundRect(0.5*inch, y - box_h, width - 1*inch, box_h, 8, stroke=1, fill=0)
        
        # Q Header
        c.setFillColor(ACCENT_CYAN)
        c.rect(0.5*inch, y - 0.35*inch, 0.45*inch, 0.35*inch, fill=1, stroke=0)
        c.setFillColor(TEXT_MAIN)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(0.725*inch, y - 0.25*inch, f"Q{res['question_number']}")
        
        # Question Text
        c.setFillColor(BG_DARK)
        c.setFont("Helvetica-Bold", 10)
        q_text = res['question_text']
        c.drawString(1.1*inch, y - 0.22*inch, (q_text[:85] + '...') if len(q_text) > 85 else q_text)
        
        # Answer
        y -= 0.6*inch
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(0.7*inch, y, "Candidate Response:")
        c.setFont("Helvetica", 9)
        ans_text = res.get('user_answer', 'No response provided.')
        ans_lines = [ans_text[k:k+95] for k in range(0, min(len(ans_text), 380), 95)]
        ay = y - 0.15*inch
        for line in ans_lines:
            c.drawString(0.9*inch, ay, line)
            ay -= 0.12*inch
            
        # AI Feedback & Score
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(ACCENT_GREEN)
        c.drawRightString(width - 0.7*inch, y, f"Grade: {res.get('ai_score', 0)}/10")
        
        feedback = res.get('ai_feedback', {})
        if feedback:
            suggestions = feedback.get('suggestions', [])
            if suggestions:
                c.setFillColor(PRIMARY)
                c.setFont("Helvetica-Oblique", 8)
                c.drawString(0.7*inch, ay - 0.1*inch, f"Improvement Hint: {suggestions[0][:115]}")
        
        y -= 2*inch

    c.save()
    buffer.seek(0)
    return buffer

def generate_overall_report_pdf(user_data, stats_data):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    add_header(c, width, height, "Career Journey & Analytics Summary")

    # Big Stats
    y = height - 2*inch
    card_w = (width - 1.5*inch) / 3
    col_names = [("Completed Tests", 'total_interviews'), ("Avg Reliability", 'avg_score'), ("Top Peak Score", 'best_score')]
    
    for i, (label, key) in enumerate(col_names):
        cx = 0.5*inch + (i * (card_w + 0.25*inch))
        c.setStrokeColor(colors.lightgrey)
        c.roundRect(cx, y - 0.9*inch, card_w, 0.9*inch, 12, stroke=1, fill=0)
        
        c.setFillColor(BG_DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(cx + card_w/2, y - 0.35*inch, label)
        c.setFillColor(PRIMARY)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(cx + card_w/2, y - 0.7*inch, str(stats_data.get(key, 0)))

    # Chart
    y -= 1.8*inch
    c.setFillColor(BG_DARK)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(0.5*inch, y, "Strength Distribution")
    
    cat_data = stats_data.get('category_scores', [])
    if cat_data:
        draw_bar_chart(c, 1*inch, y - 2*inch, [d['category'] for d in cat_data], [float(d['avg_score']) for d in cat_data])
    
    # Weakness / Roadmap
    y -= 3*inch
    c.setFont("Helvetica-Bold", 18)
    c.drawString(0.5*inch, y, "Strategic Revision Roadmap")
    y -= 0.45*inch
    
    weakness = stats_data.get('weak_areas', [])
    if weakness:
        for i, area in enumerate(weakness[:6]):
            c.setStrokeColor(ACCENT_CYAN)
            c.circle(0.7*inch, y + 0.05*inch, 0.06*inch, fill=0, stroke=1)
            c.setFillColor(BG_DARK)
            c.setFont("Helvetica", 11)
            c.drawString(0.95*inch, y, str(area))
            y -= 0.25*inch
    else:
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(0.7*inch, y, "Maintain your current focus—no significant weaknesses detected.")

    c.save()
    buffer.seek(0)
    return buffer
