from typing import List, Dict, Optional, Tuple
import httpx
import re
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from app.models.finding import FindingCategory, FindingSeverity


class ScanResult:
    """Result of a scan operation"""
    def __init__(self):
        self.normalized_url: str = ""
        self.final_url: str = ""
        self.redirect_chain: List[str] = []
        self.response_status: Optional[int] = None
        self.response_headers: Dict[str, str] = {}
        self.response_body: str = ""
        self.findings: List[Dict] = []
        self.overall_score: float = 100.0
        self.risk_level: str = "info"


class ScannerService:
    """Light scan service using HTTP requests only (non-invasive)"""
    
    USER_AGENT = "ElephantflySiteCheck/1.0"
    REQUEST_TIMEOUT = 10.0
    ROBOTS_TIMEOUT = 5.0
    MAX_REDIRECTS = 10
    
    def normalize_url(self, url: str) -> str:
        """Normalize URL: add https:// if no scheme, validate domain"""
        url = url.strip()
        
        # Remove trailing slash
        if url.endswith("/"):
            url = url[:-1]
        
        # Add scheme if missing
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        
        # Validate URL
        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                raise ValueError("Invalid URL: no domain")
            return url
        except Exception as e:
            raise ValueError(f"Invalid URL: {e}")
    
    async def perform_request(self, url: str, follow_redirects: bool = True) -> Tuple[httpx.Response, List[str]]:
        """Perform HTTP request and track redirect chain"""
        redirect_chain = [url]
        
        async with httpx.AsyncClient(
            follow_redirects=follow_redirects,
            timeout=self.REQUEST_TIMEOUT,
            headers={"User-Agent": self.USER_AGENT}
        ) as client:
            try:
                response = await client.get(url)
                
                # httpx automatically follows redirects, so we get the final URL
                # For redirect chain, we'll use the history if available
                if hasattr(response, 'history') and response.history:
                    redirect_chain = [str(r.url) for r in response.history] + [str(response.url)]
                else:
                    redirect_chain = [url, str(response.url)]
                
                return response, redirect_chain
            except httpx.TimeoutException:
                raise Exception("Request timeout")
            except httpx.ConnectError:
                raise Exception("Connection failed")
            except Exception as e:
                raise Exception(f"Request failed: {e}")
    
    def check_https_tls(self, final_url: str, response: Optional[httpx.Response] = None) -> List[Dict]:
        """Check HTTPS/TLS configuration"""
        findings = []
        
        if final_url.startswith("http://"):
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.CRITICAL,
                "title": "No HTTPS",
                "description": f"The website is accessible over HTTP only. The final URL is {final_url}. All traffic should be encrypted with HTTPS.",
                "recommendation": "Configure your web server to use HTTPS and redirect all HTTP traffic to HTTPS. Obtain an SSL/TLS certificate from a trusted Certificate Authority."
            })
        elif final_url.startswith("https://"):
            # HTTPS is present, which is good
            pass
        
        return findings
    
    def check_security_headers(self, headers: Dict[str, str]) -> List[Dict]:
        """Check for presence of security headers"""
        findings = []
        
        # High severity headers
        if "strict-transport-security" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.HIGH,
                "title": "Missing Strict-Transport-Security (HSTS)",
                "description": "The website does not set the Strict-Transport-Security header, which helps prevent man-in-the-middle attacks.",
                "recommendation": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header to enforce HTTPS connections."
            })
        
        if "content-security-policy" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.HIGH,
                "title": "Missing Content-Security-Policy (CSP)",
                "description": "The website does not set a Content-Security-Policy header, which helps prevent XSS attacks.",
                "recommendation": "Implement a Content-Security-Policy header to restrict which resources can be loaded and executed."
            })
        
        # Medium severity headers
        if "x-frame-options" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.MEDIUM,
                "title": "Missing X-Frame-Options",
                "description": "The website does not set the X-Frame-Options header, which helps prevent clickjacking attacks.",
                "recommendation": "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' header to prevent the page from being embedded in frames."
            })
        
        if "x-content-type-options" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.MEDIUM,
                "title": "Missing X-Content-Type-Options",
                "description": "The website does not set the X-Content-Type-Options header, which helps prevent MIME type sniffing.",
                "recommendation": "Add 'X-Content-Type-Options: nosniff' header to prevent browsers from MIME-sniffing responses."
            })
        
        # Low severity headers
        if "referrer-policy" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.LOW,
                "title": "Missing Referrer-Policy",
                "description": "The website does not set a Referrer-Policy header, which controls how much referrer information is sent.",
                "recommendation": "Add a Referrer-Policy header (e.g., 'Referrer-Policy: strict-origin-when-cross-origin') to control referrer information leakage."
            })
        
        if "permissions-policy" not in headers:
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.LOW,
                "title": "Missing Permissions-Policy",
                "description": "The website does not set a Permissions-Policy header, which controls browser features and APIs.",
                "recommendation": "Add a Permissions-Policy header to restrict access to browser features and APIs."
            })
        
        return findings
    
    def check_cookies(self, headers: Dict[str, str], body: str) -> List[Dict]:
        """Check for cookie presence and consent mechanisms"""
        findings = []
        
        has_set_cookie = "set-cookie" in headers
        body_lower = body.lower()
        
        # Keywords that suggest cookie consent mechanisms
        cookie_keywords = ["cookie", "consent", "banner", "preferences", "gdpr", "privacy"]
        has_cookie_keywords = any(keyword in body_lower for keyword in cookie_keywords)
        
        if has_set_cookie:
            if has_cookie_keywords:
                findings.append({
                    "category": FindingCategory.GDPR,
                    "severity": FindingSeverity.INFO,
                    "title": "Cookies detected with consent mechanism",
                    "description": "The website sets cookies and appears to have a cookie consent mechanism in place.",
                    "recommendation": "Ensure your cookie consent mechanism complies with GDPR requirements and is clearly visible to users."
                })
            else:
                findings.append({
                    "category": FindingCategory.GDPR,
                    "severity": FindingSeverity.MEDIUM,
                    "title": "Cookies detected, banner not obvious",
                    "description": "The website sets cookies but no obvious cookie consent banner or mechanism was detected on the homepage.",
                    "recommendation": "Implement a clear, GDPR-compliant cookie consent banner that appears before cookies are set."
                })
        
        return findings
    
    async def check_robots_txt(self, base_url: str) -> List[Dict]:
        """Check for robots.txt file"""
        findings = []
        
        try:
            parsed = urlparse(base_url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            
            async with httpx.AsyncClient(
                timeout=self.ROBOTS_TIMEOUT,
                headers={"User-Agent": self.USER_AGENT}
            ) as client:
                response = await client.get(robots_url)
                
                if response.status_code == 404:
                    findings.append({
                        "category": FindingCategory.SEO,
                        "severity": FindingSeverity.INFO,
                        "title": "robots.txt not found",
                        "description": "The website does not have a robots.txt file.",
                        "recommendation": "Consider adding a robots.txt file to control search engine crawling behavior."
                    })
                elif response.status_code == 200:
                    content = response.text.lower()
                    if "user-agent: *" in content and "disallow: /" in content:
                        findings.append({
                            "category": FindingCategory.SEO,
                            "severity": FindingSeverity.LOW,
                            "title": "Robots blocking indexing",
                            "description": "The robots.txt file disallows all search engines from indexing the site.",
                            "recommendation": "Review your robots.txt file. If you want your site indexed, remove or modify the 'Disallow: /' directive."
                        })
        except httpx.TimeoutException:
            # Timeout is not critical, skip
            pass
        except Exception:
            # Other errors are not critical, skip
            pass
        
        return findings
    
    def check_server_header(self, headers: Dict[str, str]) -> List[Dict]:
        """Check if Server header reveals version information"""
        findings = []
        
        server_header = headers.get("server", "").lower()
        
        # Check for version numbers (pattern: digits.digits)
        version_pattern = r'\d+\.\d+'
        if re.search(version_pattern, server_header):
            findings.append({
                "category": FindingCategory.SECURITY,
                "severity": FindingSeverity.LOW,
                "title": "Server reveals version",
                "description": f"The Server header reveals version information: {headers.get('server')}. This can help attackers identify vulnerabilities.",
                "recommendation": "Configure your web server to hide or remove version information from the Server header."
            })
        
        return findings
    
    def calculate_score(self, findings: List[Dict]) -> Tuple[float, str]:
        """Calculate overall score and risk level"""
        score = 100.0
        
        deductions = {
            FindingSeverity.CRITICAL: 30,
            FindingSeverity.HIGH: 15,
            FindingSeverity.MEDIUM: 7,
            FindingSeverity.LOW: 3,
            FindingSeverity.INFO: 1
        }
        
        for finding in findings:
            severity = finding["severity"]
            score -= deductions.get(severity, 0)
        
        # Cap at 0
        score = max(0.0, score)
        
        # Determine risk level
        if score <= 39:
            risk_level = "high"
        elif score <= 69:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return round(score, 1), risk_level
    
    async def scan_url(self, url: str) -> ScanResult:
        """Perform a comprehensive light scan of the URL"""
        result = ScanResult()
        
        try:
            # 1. Normalize URL
            result.normalized_url = self.normalize_url(url)
            
            # 2. Perform request with redirects
            response, redirect_chain = await self.perform_request(result.normalized_url)
            result.final_url = str(response.url)
            result.redirect_chain = redirect_chain
            result.response_status = response.status_code
            result.response_headers = {k.lower(): v for k, v in response.headers.items()}
            result.response_body = response.text[:50000]  # Limit body size
            
            # 3. Check HTTPS/TLS
            result.findings.extend(self.check_https_tls(result.final_url, response))
            
            # 4. Check security headers
            result.findings.extend(self.check_security_headers(result.response_headers))
            
            # 5. Check cookies
            result.findings.extend(self.check_cookies(result.response_headers, result.response_body))
            
            # 6. Check robots.txt
            result.findings.extend(await self.check_robots_txt(result.final_url))
            
            # 7. Check server header
            result.findings.extend(self.check_server_header(result.response_headers))
            
            # Calculate score
            result.overall_score, result.risk_level = self.calculate_score(result.findings)
            
        except Exception as e:
            # Add error finding
            result.findings.append({
                "category": FindingCategory.OTHER,
                "severity": FindingSeverity.HIGH,
                "title": "Scan Error",
                "description": f"An error occurred during scanning: {str(e)}",
                "recommendation": "Verify the URL is correct and accessible, and check network connectivity."
            })
            result.overall_score = 0.0
            result.risk_level = "high"
        
        return result
