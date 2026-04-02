#!/usr/bin/env python3
"""
Generate narrated title-card demo videos for PCG4, Fee Management, and Claims Core.
Uses edge-tts for narration, Pillow for slides, ffmpeg for assembly.
"""

import subprocess
import os
import json
import math
from PIL import Image, ImageDraw, ImageFont

# ── Configuration ──────────────────────────────────────────────────────────────

BASE_DIR = "/Users/s/workspace/zorbit/02_repos/zorbit-admin-console/public/demos"
TMP_DIR = "/tmp/zorbit-video-gen"
WIDTH, HEIGHT = 1920, 1080
VOICE = "en-US-AriaNeural"

# Colors - dark navy + indigo theme
BG_TOP = (10, 15, 40)       # Dark navy
BG_BOT = (30, 25, 80)       # Deep indigo
ACCENT = (100, 80, 220)     # Indigo accent
ACCENT2 = (60, 180, 255)    # Bright blue accent
TEXT_WHITE = (255, 255, 255)
TEXT_DIM = (180, 185, 210)
TEXT_ACCENT = (140, 160, 255)
DIVIDER = (80, 70, 160)

# ── Font helpers ──────────────────────────────────────────────────────────────

def get_font(size, bold=False):
    """Get a font, falling back gracefully."""
    font_paths = [
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFCompact.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

FONT_TITLE = get_font(72, bold=True)
FONT_SUBTITLE = get_font(42)
FONT_BODY = get_font(36)
FONT_SMALL = get_font(28)
FONT_BADGE = get_font(24)

# ── Drawing helpers ───────────────────────────────────────────────────────────

def draw_gradient_bg(draw):
    """Draw vertical gradient background."""
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * ratio)
        g = int(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * ratio)
        b = int(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

def draw_accent_line(draw, y, width=400):
    """Draw a horizontal accent line."""
    x_start = (WIDTH - width) // 2
    draw.line([(x_start, y), (x_start + width, y)], fill=ACCENT, width=3)

def draw_dot_grid(draw):
    """Draw subtle dot grid pattern."""
    for x in range(0, WIDTH, 60):
        for y in range(0, HEIGHT, 60):
            alpha = 15 + (y % 120 == 0) * 10
            draw.ellipse([x-1, y-1, x+1, y+1], fill=(80, 70, 140, alpha))

def text_width(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]

def text_height(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]

def draw_centered_text(draw, y, text, font, fill=TEXT_WHITE):
    w = text_width(draw, text, font)
    draw.text(((WIDTH - w) // 2, y), text, font=font, fill=fill)

def draw_pill(draw, x, y, text, font, bg_color=ACCENT, text_color=TEXT_WHITE):
    """Draw a rounded pill/badge with text."""
    tw = text_width(draw, text, font)
    th = text_height(draw, text, font)
    pad_x, pad_y = 20, 8
    rx, ry = x, y
    rw, rh = tw + pad_x * 2, th + pad_y * 2
    draw.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=rh//2, fill=bg_color)
    draw.text((rx + pad_x, ry + pad_y), text, font=font, fill=text_color)
    return rw

def draw_flow_arrow(draw, x1, y, x2, color=ACCENT2):
    """Draw a horizontal arrow."""
    draw.line([(x1, y), (x2, y)], fill=color, width=3)
    draw.polygon([(x2, y), (x2-12, y-8), (x2-12, y+8)], fill=color)


# ── Slide generators ─────────────────────────────────────────────────────────

def make_slide(title_line1, title_line2, bullets=None, flow=None, two_col=None):
    """Generic slide generator with multiple layout options."""
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)
    draw_gradient_bg(draw)
    draw_dot_grid(draw)

    # Title
    draw_centered_text(draw, 80, title_line1, FONT_TITLE, TEXT_WHITE)
    if title_line2:
        draw_centered_text(draw, 170, title_line2, FONT_SUBTITLE, TEXT_DIM)

    draw_accent_line(draw, 240, 500)

    content_y = 290

    if flow:
        # Flow diagram: items connected by arrows
        item_count = len(flow)
        total_w = 0
        widths = []
        for item in flow:
            w = text_width(draw, item, FONT_BADGE) + 40
            widths.append(w)
            total_w += w
        arrow_space = 50
        total_w += arrow_space * (item_count - 1)
        start_x = (WIDTH - total_w) // 2
        cx = start_x
        flow_y = content_y + 30
        for i, (item, w) in enumerate(zip(flow, widths)):
            draw_pill(draw, cx, flow_y, item, FONT_BADGE, ACCENT)
            if i < item_count - 1:
                draw_flow_arrow(draw, cx + w + 5, flow_y + 20, cx + w + arrow_space - 5)
            cx += w + arrow_space
        content_y = flow_y + 80

    if bullets:
        left_margin = 200
        for i, bullet in enumerate(bullets):
            by = content_y + i * 58
            # Bullet dot
            draw.ellipse([left_margin, by + 14, left_margin + 12, by + 26], fill=ACCENT2)
            draw.text((left_margin + 30, by), bullet, font=FONT_BODY, fill=TEXT_WHITE)

    if two_col:
        col1, col2 = two_col
        col1_x = 150
        col2_x = WIDTH // 2 + 50
        for i, item in enumerate(col1):
            by = content_y + i * 55
            draw.ellipse([col1_x, by + 14, col1_x + 10, by + 24], fill=ACCENT2)
            draw.text((col1_x + 25, by), item, font=FONT_BODY, fill=TEXT_WHITE)
        for i, item in enumerate(col2):
            by = content_y + i * 55
            draw.ellipse([col2_x, by + 14, col2_x + 10, by + 24], fill=ACCENT2)
            draw.text((col2_x + 25, by), item, font=FONT_BODY, fill=TEXT_WHITE)

    # Bottom branding
    draw_centered_text(draw, HEIGHT - 60, "Zorbit Platform", FONT_SMALL, TEXT_DIM)

    return img


# ── Video definitions ─────────────────────────────────────────────────────────

VIDEOS = [
    {
        "name": "pcg4-overview",
        "output_dir": "pcg4",
        "narration": (
            "Welcome to PCG4 — the Product Configurator Generation Four. "
            "This is Zorbit's module for designing, reviewing, and deploying insurance product configurations. "
            "PCG4 provides a visual eight-step wizard that guides product analysts through every aspect of product design. "
            "Start with insurer details and product information. "
            "Then define your plans — each plan represents a coverage tier like Bronze, Silver, Gold, or Platinum. "
            "Configure the base parameters — sum insured ranges, deductibles, copay structures, and coinsurance rules. "
            "The encounter taxonomy is where PCG4 truly shines. "
            "Forty-four encounter types organized across preventive care, primary care, specialist care, emergency services, and inpatient hospitalization. "
            "Each encounter maps to specific benefits with configurable limits, sub-limits, and waiting periods. "
            "Network tier configuration lets you define hospital networks — from basic government facilities to premium private hospitals — each with different coverage levels. "
            "The approval workflow ensures quality — configurations move through Drafter, Reviewer, Approver, and Publisher stages before reaching production. "
            "Version control tracks every change, and rollback is always available. "
            "Once approved, deployment is a single click — pushing the configuration to production systems that power quotation engines and claims processing. "
            "This is PCG4 — insurance product design, simplified."
        ),
        "slides": [
            lambda: make_slide("PCG4", "Product Configurator", bullets=[
                "Insurance Product Design, Simplified",
                "Visual 8-step configuration wizard",
                "44 encounter types across 5 categories",
                "Multi-tier plan support",
                "Approval workflow with version control",
                "Single-click deployment to production"
            ]),
            lambda: make_slide("8-Step Configuration Wizard", None, bullets=[
                "1. Insurer Details",
                "2. Product Information",
                "3. Plan Creation (Bronze / Silver / Gold / Platinum)",
                "4. Base Configuration (Sum Insured, Deductibles, Copays)",
                "5. Encounter & Benefit Mapping",
                "6. Network Tier Configuration",
                "7. Overrides & Exceptions",
                "8. Review & Publish"
            ]),
            lambda: make_slide("44 Encounter Types", "Comprehensive Healthcare Coverage", two_col=(
                ["Preventive Care", "Primary Care", "Specialist Care", "Emergency Services", "Inpatient Hospitalization"],
                ["Wellness & Screenings", "GP Visits & Lab Tests", "20+ Specialties", "ER & Ambulance", "Surgery & ICU"]
            )),
            lambda: make_slide("Plan & Network Tiers", "Flexible Coverage Structures",
                flow=["Bronze", "Silver", "Gold", "Platinum"],
                bullets=[
                    "Each plan: unique sum insured, deductibles, copays",
                    "Hospital networks: Government to Premium Private",
                    "Coverage levels vary by network tier",
                    "Geographic coverage configuration"
                ]),
            lambda: make_slide("Approval Workflow", "Quality-Controlled Configuration",
                flow=["Drafter", "Reviewer", "Approver", "Publisher"],
                bullets=[
                    "Maker-checker-publisher pattern",
                    "Each stage validates configuration integrity",
                    "Audit trail for every change",
                    "Rollback to any previous version"
                ]),
            lambda: make_slide("Version Control & Deployment", "From Design to Production", bullets=[
                "Full version history for every configuration",
                "Side-by-side version comparison",
                "Rollback to any previous version",
                "Single-click deployment to production",
                "Powers quotation engines and claims processing",
                "PCG4 — Insurance Product Design, Simplified"
            ]),
        ],
    },
    {
        "name": "pcg4-deep-dive",
        "output_dir": "pcg4",
        "narration": (
            "Let's take a deep dive into the PCG4 Configuration Designer — the eight steps that transform insurance product requirements into deployable configurations. "
            "Step one — Insurer Details. Enter the insurance company name, license number, regulatory authority — DHA for Dubai, IRDAI for India, state departments for the US. This establishes the regulatory context for the entire product. "
            "Step two — Product Details. Name your product, select the insurance line — health, motor, marine, or life. Choose the product type — individual, floater, or group. Set the effective date range and geographic coverage. "
            "Step three — Create Plans. Each plan is a coverage tier. Define the plan name, the sum insured, annual premium ranges, and the target demographic. A typical health product has three to five plans spanning basic to premium coverage. "
            "Step four — Base Configuration. This is where the numbers live. Deductible amounts, copay percentages, coinsurance splits, room rent limits, and annual aggregate limits. Each parameter can vary by plan tier. "
            "Step five — Encounters and Benefits. The heart of the product. Map each of the forty-four encounter types to specific benefits. Outpatient consultation — covered up to five hundred per visit. Hospitalization — covered at eighty percent up to the sum insured. Dental cleaning — two visits per year. Every benefit can have sub-limits, waiting periods, and exclusions. "
            "Step six — Network Configuration. Define which hospitals and clinics are in each network tier. Platinum network might include all private hospitals. Silver might be limited to government and mid-tier facilities. "
            "Step seven — Overrides and Exceptions. Apply special rules — age-based loading, pre-existing condition waiting periods, maternity sub-limits. These override the base configuration for specific scenarios. "
            "Step eight — Review and Publish. A complete summary of the entire configuration. Compare against previous versions. Submit for approval. Once approved, deploy to production with confidence."
        ),
        "slides": [
            lambda: make_slide("PCG4 Deep Dive", "8 Steps to a Complete Product Configuration", bullets=[
                "From requirements to deployable configurations",
                "Each step builds on the previous",
                "Validation at every stage",
                "Supports health, motor, marine, and life insurance"
            ]),
            lambda: make_slide("Steps 1-2: Foundation", "Insurer Details + Product Details", bullets=[
                "Company name, license number, regulatory authority",
                "DHA (Dubai), IRDAI (India), State Depts (US)",
                "Product name, insurance line, product type",
                "Effective date range, geographic coverage",
                "Individual, Floater, or Group"
            ]),
            lambda: make_slide("Steps 3-4: Plans & Configuration", "Coverage Tiers + Financial Parameters", bullets=[
                "Plan tiers: Bronze through Platinum",
                "Sum insured and annual premium ranges",
                "Deductible amounts, copay percentages",
                "Coinsurance splits, room rent limits",
                "Annual aggregate limits per plan tier"
            ]),
            lambda: make_slide("Step 5: Encounters & Benefits", "The Heart of the Product", bullets=[
                "44 encounter types mapped to benefits",
                "Outpatient: up to 500 per visit",
                "Hospitalization: 80% up to sum insured",
                "Dental: 2 visits per year",
                "Sub-limits, waiting periods, exclusions"
            ]),
            lambda: make_slide("Steps 6-7: Networks & Overrides", "Customization Layer", bullets=[
                "Hospital network tiers (Government to Premium)",
                "Platinum: all private hospitals",
                "Silver: government + mid-tier facilities",
                "Age-based loading factors",
                "Pre-existing condition waiting periods",
                "Maternity sub-limits and overrides"
            ]),
            lambda: make_slide("Step 8: Review & Deploy", "Final Validation and Deployment",
                flow=["Review", "Compare", "Approve", "Deploy"],
                bullets=[
                    "Complete configuration summary",
                    "Side-by-side version comparison",
                    "Submit for approval workflow",
                    "Deploy to production with confidence"
                ]),
        ],
    },
    {
        "name": "pcg4-encounters",
        "output_dir": "pcg4",
        "narration": (
            "The encounter taxonomy is PCG4's most sophisticated feature — forty-four standardized encounter types that cover every possible healthcare interaction. "
            "Preventive Care includes wellness checkups, vaccinations, health screenings, and health education programs — the proactive side of healthcare. "
            "Primary Care covers general practitioner consultations, prescription medications, diagnostic lab tests, and basic imaging like X-rays. These are the everyday healthcare encounters. "
            "Specialist Care branches into twenty-plus sub-categories — cardiology, orthopedics, dermatology, ophthalmology, ENT, neurology, gastroenterology, and more. Each specialist consultation has its own benefit structure and authorization requirements. "
            "Emergency Services include emergency room visits, ambulance transport, and urgent care — with special rules for copay waivers in true emergencies. "
            "Inpatient Hospitalization covers room and board, surgical procedures, ICU stays, organ transplants, and rehabilitation. These high-cost encounters typically have the most complex benefit structures with per-day limits, procedure-specific caps, and pre-authorization requirements. "
            "The Coverage Mapper lets you visually connect encounter types to benefit definitions — drag and drop encounters onto benefit buckets, set limits, and preview how the configuration affects different patient scenarios. "
            "Every encounter type follows international coding standards, making the taxonomy compatible with ICD-10, CPT, and DRG coding systems worldwide."
        ),
        "slides": [
            lambda: make_slide("Encounter Taxonomy", "44 Healthcare Encounter Types", bullets=[
                "Standardized coverage for every healthcare interaction",
                "5 major categories, 44 encounter types",
                "International coding standards compatible",
                "Visual Coverage Mapper interface"
            ]),
            lambda: make_slide("Preventive & Primary Care", "Everyday Healthcare", two_col=(
                ["Wellness Checkups", "Vaccinations", "Health Screenings", "Education Programs"],
                ["GP Consultations", "Prescriptions", "Lab Tests", "Basic Imaging (X-Ray)"]
            )),
            lambda: make_slide("Specialist Care", "20+ Medical Specialties", bullets=[
                "Cardiology, Orthopedics, Dermatology",
                "Ophthalmology, ENT, Neurology",
                "Gastroenterology, Urology, Pulmonology",
                "Each specialty: unique benefit structure",
                "Individual authorization requirements"
            ]),
            lambda: make_slide("Emergency & Inpatient", "High-Acuity Encounters", two_col=(
                ["ER Visits", "Ambulance Transport", "Urgent Care", "Copay Waivers"],
                ["Room & Board", "Surgery & ICU", "Organ Transplant", "Rehabilitation"]
            )),
            lambda: make_slide("Coverage Mapper", "Visual Benefit Configuration", bullets=[
                "Drag-and-drop encounter-to-benefit mapping",
                "Set limits per encounter type",
                "Sub-limits and waiting periods",
                "Preview patient scenario impact",
                "Real-time configuration validation"
            ]),
            lambda: make_slide("International Standards", "Global Compatibility", bullets=[
                "ICD-10 diagnostic coding",
                "CPT procedure coding",
                "DRG classification system",
                "Compatible with global healthcare systems",
                "Standardized taxonomy across all products"
            ]),
        ],
    },
    {
        "name": "fee-management-overview",
        "output_dir": "fee-management",
        "narration": (
            "Introducing Zorbit Fee Management — the Slice of Pie module that handles every financial transaction between insurance ecosystem participants. "
            "Configure fees as percentage-based commissions, fixed amounts, or tiered structures that scale with premium volume. "
            "Each fee configuration specifies who pays, who receives, which products it applies to, and the effective date range. "
            "Invoice generation is automatic — when a quotation is approved, the system calculates fees based on the applicable configurations and generates invoices with detailed line items. "
            "Track payments against invoices in real time — partial payments, overpayments, and outstanding balances are all handled. "
            "Generate period statements for any participant — brokers see their commission earnings, distributors see their service fees, and insurers see the complete financial picture. "
            "This is Fee Management — transparent, automated, auditable."
        ),
        "slides": [
            lambda: make_slide("Fee Management", "The Slice of Pie", bullets=[
                "Every financial transaction between participants",
                "Percentage, fixed, or tiered fee structures",
                "Automatic invoice generation",
                "Real-time payment tracking",
                "Transparent, automated, auditable"
            ]),
            lambda: make_slide("Fee Configurations", "Flexible Fee Structures", bullets=[
                "Percentage-based commissions",
                "Fixed amount fees",
                "Tiered structures (volume-based)",
                "Product and organization scoping",
                "Effective date range control"
            ]),
            lambda: make_slide("Auto Invoice Generation", "From Quotation to Invoice",
                flow=["Quote Approved", "Fees Calculated", "Invoice Created", "Sent"],
                bullets=[
                    "Triggered on quotation approval",
                    "Applies matching fee configurations",
                    "Detailed line items per fee type",
                    "PDF generation and delivery"
                ]),
            lambda: make_slide("Payment Tracking", "Real-Time Reconciliation", bullets=[
                "Partial payment support",
                "Full payment recording",
                "Overdue tracking and alerts",
                "Overpayment handling",
                "Automatic reconciliation"
            ]),
            lambda: make_slide("Period Statements", "Every Participant's View", bullets=[
                "Broker commission statements",
                "Distributor service fee reports",
                "Insurer financial overview",
                "Configurable period (monthly/quarterly/annual)",
                "Export to PDF and CSV"
            ]),
        ],
    },
    {
        "name": "claims-overview",
        "output_dir": "claims",
        "narration": (
            "Welcome to Zorbit Claims Management — the complete claim lifecycle from first notification to final settlement. "
            "When an incident occurs, the claimant or their representative intimates a claim — providing basic incident details, supporting documents, and estimated costs. "
            "The claim moves through a structured pipeline. Assessment by a qualified assessor who reviews medical records, police reports, or repair estimates. "
            "Adjudication by an authorized decision-maker who approves, partially approves, or denies the claim based on policy terms and assessment findings. "
            "Settlement processing handles the approved amount — calculating deductibles, copays, and the final payable amount. Payment is recorded with method, reference, and beneficiary details. "
            "The system supports ten claim types across health and motor insurance — from hospitalization and outpatient treatment to vehicle accidents and theft. "
            "Five provider types — hospitals, clinics, garages, workshops, and pharmacies — each with network status tracking. "
            "Every action is timestamped in the claim timeline, creating a complete audit trail from intimation to closure. "
            "This is Claims Management — structured, auditable, multi-line."
        ),
        "slides": [
            lambda: make_slide("Claims Management", "From Intimation to Settlement", bullets=[
                "Complete claim lifecycle management",
                "10 claim types across health and motor",
                "5 provider types with network tracking",
                "Full audit trail on every action",
                "Structured, auditable, multi-line"
            ]),
            lambda: make_slide("Claim Lifecycle", "Structured Pipeline",
                flow=["Intimated", "Initiated", "Assessment", "Adjudication", "Settlement", "Closed"],
                bullets=[
                    "Incident notification with documents",
                    "Qualified assessor review",
                    "Authorized adjudication decision",
                    "Deductible and copay calculation"
                ]),
            lambda: make_slide("10 Claim Types", "Health and Motor Coverage", two_col=(
                ["Hospitalization", "Outpatient", "Dental", "Optical", "Maternity"],
                ["Vehicle Accident", "Theft", "Fire Damage", "Natural Disaster", "Third Party"]
            )),
            lambda: make_slide("Provider Network", "5 Provider Types", bullets=[
                "Hospitals — inpatient and emergency",
                "Clinics — outpatient and specialist",
                "Garages — motor vehicle repair",
                "Workshops — specialized repair facilities",
                "Pharmacies — prescription fulfillment"
            ]),
            lambda: make_slide("Complete Audit Trail", "Every Action Tracked", bullets=[
                "Timestamped claim timeline",
                "Who performed each action",
                "What changed at each step",
                "Document attachment tracking",
                "From first notification to final closure"
            ]),
        ],
    },
]


# ── Generation pipeline ──────────────────────────────────────────────────────

def generate_video(video_def):
    name = video_def["name"]
    output_dir = os.path.join(BASE_DIR, video_def["output_dir"])
    narration = video_def["narration"]
    slides = video_def["slides"]

    print(f"\n{'='*60}")
    print(f"  Generating: {name}")
    print(f"{'='*60}")

    tmp = os.path.join(TMP_DIR, name)
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # 1. Save narration text
    narration_file = os.path.join(output_dir, f"{name}-narration.txt")
    with open(narration_file, "w") as f:
        f.write(narration)
    print(f"  Saved narration: {narration_file}")

    # 2. Generate audio with edge-tts
    audio_file = os.path.join(tmp, "narration.mp3")
    print(f"  Generating audio with edge-tts...")
    subprocess.run([
        "edge-tts",
        "--voice", VOICE,
        "--text", narration,
        "--write-media", audio_file
    ], check=True, capture_output=True)

    # 3. Get audio duration
    result = subprocess.run([
        "ffprobe", "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "csv=p=0",
        audio_file
    ], capture_output=True, text=True, check=True)
    duration = float(result.stdout.strip())
    print(f"  Audio duration: {duration:.1f}s")

    # 4. Generate slides
    num_slides = len(slides)
    slide_duration = duration / num_slides
    print(f"  Generating {num_slides} slides ({slide_duration:.1f}s each)...")

    slide_files = []
    for i, slide_fn in enumerate(slides):
        img = slide_fn()
        slide_path = os.path.join(tmp, f"slide_{i:02d}.png")
        img.save(slide_path, "PNG")
        slide_files.append(slide_path)

    # 5. Create ffmpeg concat file
    concat_file = os.path.join(tmp, "concat.txt")
    with open(concat_file, "w") as f:
        for i, slide_path in enumerate(slide_files):
            f.write(f"file '{slide_path}'\n")
            f.write(f"duration {slide_duration:.3f}\n")
        # Repeat last frame (ffmpeg concat demuxer requirement)
        f.write(f"file '{slide_files[-1]}'\n")

    # 6. Assemble video
    output_file = os.path.join(output_dir, f"{name}.mp4")
    print(f"  Assembling video...")
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_file,
        "-i", audio_file,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        output_file
    ], check=True, capture_output=True)
    print(f"  Output: {output_file}")

    # 7. Generate thumbnail
    thumb_time = duration / 3 + 2
    thumb_file = os.path.join(output_dir, f"{name}-thumb.jpg")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", output_file,
        "-ss", f"{thumb_time:.1f}",
        "-vframes", "1",
        "-q:v", "2",
        thumb_file
    ], check=True, capture_output=True)
    print(f"  Thumbnail: {thumb_file}")

    # Get file size
    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"  Size: {size_mb:.1f} MB, Duration: {duration:.1f}s")

    return output_file, duration, size_mb


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs(TMP_DIR, exist_ok=True)

    results = []
    for video_def in VIDEOS:
        try:
            output_file, duration, size_mb = generate_video(video_def)
            results.append({
                "name": video_def["name"],
                "file": output_file,
                "duration": f"{duration:.1f}s",
                "size": f"{size_mb:.1f} MB",
                "status": "OK"
            })
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append({
                "name": video_def["name"],
                "status": f"FAILED: {e}"
            })

    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    for r in results:
        status = r["status"]
        if status == "OK":
            print(f"  {r['name']:30s} {r['duration']:>8s} {r['size']:>10s}  OK")
        else:
            print(f"  {r['name']:30s} {status}")
    print()
