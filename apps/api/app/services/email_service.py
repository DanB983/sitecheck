"""
Email service for sending alerts.

TODO: Replace this placeholder with real email integration.
For production, integrate with:
- SendGrid
- AWS SES
- Mailgun
- Postmark
- Or your preferred email service

Example integration:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    message = Mail(
        from_email='alerts@sitecheck.com',
        to_emails=user_email,
        subject=alert.subject,
        html_content=alert.html_body
    )
    sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    response = sg.send(message)
"""

from app.models.alert import Alert
from app.models.site import Site


def send_alert_email(alert: Alert, site: Site) -> None:
    """
    Send email notification for an alert.
    
    This is a placeholder that logs to console.
    Replace with real email integration in production.
    
    Args:
        alert: The alert to send notification for
        site: The site the alert is for
    """
    # TODO: Get user email from site relationship or user preferences
    # For now, this is just a placeholder
    
    # Placeholder: Log to console (matching requirements format)
    print("EMAIL:", alert.message)
    
    # TODO: Replace with real email integration:
    # Example with SendGrid:
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # 
    # message = Mail(
    #     from_email='alerts@sitecheck.com',
    #     to_emails=user_email,
    #     subject=f"Alert: {alert.alert_type.value} for {site.display_name}",
    #     html_content=f"<p>{alert.message}</p><p>View report: [Link]</p>"
    # )
    # sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    # response = sg.send(message)

