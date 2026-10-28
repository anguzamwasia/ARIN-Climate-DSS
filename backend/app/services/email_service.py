import os
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "networkarin@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("GMAIL_APP_PASSWORD", "")).strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "ARIN Climate Decision Support System")
BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://arin-climatedata.org")

def _send_email_worker(to_email: str, subject: str, body_text: str, html_content: str):
    if not to_email:
        return

    # Check if SMTP credentials are configured
    if not SMTP_PASSWORD:
        print(f"\n==================================================")
        print(f"[EMAIL SERVICE - SIMULATION MODE]")
        print(f"From: {SMTP_FROM_NAME} <{SMTP_USER}>")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"Note: To send live Gmail emails, add SMTP_PASSWORD (Google App Password) to backend/.env")
        print(f"==================================================\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((SMTP_FROM_NAME, SMTP_USER))
        msg["To"] = to_email

        # Attach text and html parts
        part_text = MIMEText(body_text, "plain", "utf-8")
        msg.attach(part_text)

        if html_content:
            part_html = MIMEText(html_content, "html", "utf-8")
            msg.attach(part_html)

        # Connect to Gmail SMTP
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
        server.quit()

        print(f"✅ [EMAIL DISPATCHED] Successfully sent email to {to_email} via {SMTP_USER} ({subject})")
    except Exception as e:
        print(f"❌ [EMAIL SEND ERROR] Failed to send email to {to_email} via {SMTP_USER}: {e}")

def send_email_async(to_email: str, subject: str, body_text: str, html_content: str = None):
    """Sends an email in a background daemon thread so HTTP requests remain instantaneous."""
    if not to_email:
        return
    thread = threading.Thread(
        target=_send_email_worker,
        args=(to_email.strip().lower(), subject, body_text, html_content),
        daemon=True
    )
    thread.start()

def _build_html_template(headline: str, greeting: str, paragraphs: list, action_label: str = None, action_url: str = None, note: str = None) -> str:
    """Creates a consistent, professional ARIN branded email layout."""
    paragraphs_html = "".join([f"<p style='margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;'>{p}</p>" for p in paragraphs])
    button_html = ""
    if action_label and action_url:
        button_html = f"""
        <div style='margin: 28px 0; text-align: center;'>
            <a href='{action_url}' style='background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block;'>{action_label}</a>
        </div>
        """
    note_html = f"<div style='margin-top: 20px; padding: 12px 16px; background-color: #f3f4f6; border-left: 4px solid #059669; border-radius: 4px; font-size: 13px; color: #4b5563;'>{note}</div>" if note else ""

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{headline}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background-color: #065f46; padding: 28px 32px; text-align: left;">
            <span style="display: inline-block; background-color: #047857; color: #a7f3d0; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">ARIN Climate DSS</span>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">{headline}</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">{greeting}</p>
            {paragraphs_html}
            {button_html}
            {note_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
            <p style="margin: 0 0 4px;"><strong>Africa Research and Impact Network (ARIN)</strong></p>
            <p style="margin: 0 0 8px;">Climate Decision Support System (DSS) Platform</p>
            <p style="margin: 0;"><a href="{BASE_URL}" style="color: #059669; text-decoration: none;">arin-climatedata.org</a> • Contact: <a href="mailto:networkarin@gmail.com" style="color: #059669; text-decoration: none;">networkarin@gmail.com</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def send_submission_received_email(to_email: str, author_name: str, title: str, post_type: str = "research", is_resubmission: bool = False):
    """Notifies contributor that their research or story has been received and is under review."""
    is_research = post_type == "research"
    type_label = "Research Paper" if is_research else "Community Story"

    if is_resubmission:
        subject = f"ARIN Climate DSS: Revised {type_label} Received — \"{title}\""
        headline = f"Revised {type_label} Received"
        greeting = f"Hello {author_name or 'Contributor'},"
        paragraphs = [
            f"Thank you for revising and resubmitting your {type_label.lower()} titled <strong>\"{title}\"</strong>.",
            "Your updated content has been successfully received by the ARIN editorial board and is currently under review.",
            "Our reviewers will examine your updates against the feedback provided and notify you by email as soon as the review is complete."
        ]
        body_text = f"Hello {author_name},\n\nYour revised {type_label.lower()} '{title}' has been successfully received and is currently under review by our editorial team.\n\nWe will notify you once evaluation is complete.\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"
    else:
        subject = f"ARIN Climate DSS: {type_label} Received — \"{title}\""
        headline = f"{type_label} Under Review"
        greeting = f"Hello {author_name or 'Contributor'},"
        paragraphs = [
            f"Thank you for submitting your {type_label.lower()} titled <strong>\"{title}\"</strong> to the ARIN Climate Decision Support System (DSS).",
            f"We have successfully received your submission. It has been routed to our scientific and community editorial team for quality assurance and verification.",
            "Once evaluated, you will receive an automated notification with the review outcome."
        ]
        body_text = f"Hello {author_name},\n\nThank you for submitting your {type_label.lower()} titled '{title}'.\n\nYour submission has been successfully received and is currently under review by our editorial team.\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"

    html = _build_html_template(
        headline=headline,
        greeting=greeting,
        paragraphs=paragraphs,
        action_label="Visit ARIN Platform",
        action_url=f"{BASE_URL}/blogs",
        note=f"Submission Type: {type_label} • Status: Pending Editorial Review"
    )
    send_email_async(to_email, subject, body_text, html)

def send_approval_email(to_email: str, author_name: str, title: str, post_type: str = "research", blog_id: int = None, is_edited: bool = False):
    """Notifies contributor that their research or story has been approved and published."""
    is_research = post_type == "research"
    type_label = "Research Paper" if is_research else "Community Story"
    article_url = f"{BASE_URL}/blogs/{blog_id}" if blog_id else f"{BASE_URL}/blogs"

    if is_edited:
        subject = f"ARIN Climate DSS: Your {type_label} has been Approved with Edits 🎉"
        headline = f"{type_label} Approved with Minor Edits"
        greeting = f"Hello {author_name or 'Contributor'},"
        paragraphs = [
            f"Great news! Your {type_label.lower()} titled <strong>\"{title}\"</strong> has been reviewed, approved, and officially published on the ARIN Climate DSS platform.",
            "Our editorial team made minor copy and structural adjustments to optimize clarity, formatting, and alignment with our publishing guidelines.",
            "You can log in to your contributor account to view a side-by-side comparison between your original draft and the published article."
        ]
        body_text = f"Hello {author_name},\n\nCongratulations! Your {type_label.lower()} '{title}' has been approved and published on ARIN Climate DSS with minor editorial adjustments by the administrator.\n\nYou can view the published article here:\n{article_url}\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"
        note = "Notice: Minor editorial refinements were made by the administrator prior to publication."
    else:
        subject = f"ARIN Climate DSS: Congratulations! Your {type_label} is Now Live 🎉"
        headline = f"{type_label} Approved & Published"
        greeting = f"Hello {author_name or 'Contributor'},"
        paragraphs = [
            f"Congratulations! Your {type_label.lower()} titled <strong>\"{title}\"</strong> has been officially approved and published on the ARIN Climate DSS platform.",
            "Your insights are now live and accessible to researchers, policy makers, and community leaders across Africa, and have been indexed in our AI Knowledge Base.",
            "Thank you for sharing your valuable knowledge and advancing climate resilience."
        ]
        body_text = f"Hello {author_name},\n\nCongratulations! Your {type_label.lower()} '{title}' has been approved and is now live on the ARIN Climate DSS platform.\n\nYou can view your published work here:\n{article_url}\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"
        note = f"Status: Live & Published • Indexed in AI Knowledge Base"

    html = _build_html_template(
        headline=headline,
        greeting=greeting,
        paragraphs=paragraphs,
        action_label="View Your Published Article",
        action_url=article_url,
        note=note
    )
    send_email_async(to_email, subject, body_text, html)

def send_revision_requested_email(to_email: str, author_name: str, title: str, post_type: str = "research", feedback: str = "", blog_id: int = None):
    """Notifies contributor that changes are required before their research or story can be approved."""
    is_research = post_type == "research"
    type_label = "Research Paper" if is_research else "Community Story"
    edit_url = f"{BASE_URL}/blog/submit?id={blog_id}" if blog_id else f"{BASE_URL}/blog/submit"

    subject = f"ARIN Climate DSS: Revision Requested for your {type_label} ⚠️"
    headline = f"Action Required: Revision Requested"
    greeting = f"Hello {author_name or 'Contributor'},"
    paragraphs = [
        f"Thank you for submitting your {type_label.lower()} titled <strong>\"{title}\"</strong> to the ARIN Climate DSS platform.",
        "Our editorial reviewers have inspected your work. Before we can approve and publish it, we kindly request that you address the editorial feedback below.",
        f"<div style='background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 12px 0;'><strong style='color: #991b1b;'>Reviewer Feedback:</strong><p style='margin: 8px 0 0; color: #7f1d1d; font-size: 14px;'>{feedback or 'Please review your content, structure, and citations before resubmitting.'}</p></div>",
        "You can easily log in to your contributor dashboard to make the necessary changes and resubmit your draft."
    ]
    body_text = f"Hello {author_name},\n\nYour {type_label.lower()} '{title}' requires revision before it can be approved.\n\nReviewer Feedback:\n{feedback}\n\nPlease update your submission here:\n{edit_url}\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"

    html = _build_html_template(
        headline=headline,
        greeting=greeting,
        paragraphs=paragraphs,
        action_label="Edit & Resubmit Your Work",
        action_url=edit_url,
        note="Status: Revisions Requested • Please address reviewer comments to proceed."
    )
    send_email_async(to_email, subject, body_text, html)

def send_published_updated_email(to_email: str, author_name: str, title: str, post_type: str = "research", blog_id: int = None):
    """Notifies author that their already published research or story was updated by an administrator."""
    is_research = post_type == "research"
    type_label = "Research Paper" if is_research else "Community Story"
    article_url = f"{BASE_URL}/blogs/{blog_id}" if blog_id else f"{BASE_URL}/blogs"

    subject = f"ARIN Climate DSS: Editorial Update to Published {type_label} ✍️"
    headline = f"Published {type_label} Updated"
    greeting = f"Hello {author_name or 'Contributor'},"
    paragraphs = [
        f"This is an automated notification regarding your published {type_label.lower()} titled <strong>\"{title}\"</strong>.",
        "An administrator has made editorial updates to your live document to keep information current and maintain high presentation quality.",
        "The live public article on ARIN Climate DSS and the AI Knowledge Base search index have both been updated with these changes."
    ]
    body_text = f"Hello {author_name},\n\nYour published {type_label.lower()} '{title}' has been updated with editorial adjustments by an administrator.\n\nYou can view the updated article here:\n{article_url}\n\nWarm regards,\nARIN Climate Decision Support System\nnetworkarin@gmail.com"

    html = _build_html_template(
        headline=headline,
        greeting=greeting,
        paragraphs=paragraphs,
        action_label="View Updated Article",
        action_url=article_url,
        note="Status: Live on Platform • Updated by Administrator"
    )
    send_email_async(to_email, subject, body_text, html)
