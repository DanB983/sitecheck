from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.core.config import settings


class LLMClient(ABC):
    """Provider-agnostic LLM client interface"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM"""
        pass
    
    @abstractmethod
    async def generate_explanation(self, scan_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an AI explanation for a scan report"""
        pass


class StubLLMClient(LLMClient):
    """Stub implementation for development with deterministic output"""
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Returns a stub response"""
        return f"[Stub LLM Response] Processed prompt: {prompt[:50]}..."
    
    async def generate_explanation(self, scan_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate deterministic explanation based on scan data"""
        score = scan_report.get("overall_score", 100)
        risk_level = scan_report.get("risk_level", "info")
        findings = scan_report.get("findings", [])
        
        # Get top findings by severity
        critical_findings = [f for f in findings if f.get("severity") == "critical"]
        high_findings = [f for f in findings if f.get("severity") == "high"]
        medium_findings = [f for f in findings if f.get("severity") == "medium"]
        
        # Executive summary based on score
        if score >= 80:
            executive_summary = (
                f"Your website security score is {int(score)}/100, which is good. "
                "You're doing well with basic security measures, but there's always room for improvement. "
                "This scan checked for common security headers, HTTPS configuration, and basic compliance issues. "
                "Remember: this is a light automated scan, not a penetration test."
            )
        elif score >= 50:
            executive_summary = (
                f"Your website security score is {int(score)}/100, which needs attention. "
                "You have some security gaps that should be addressed to better protect your visitors and your business. "
                "The good news is that many of these issues can be fixed relatively easily. "
                "This scan checked for common security headers, HTTPS configuration, and basic compliance issues. "
                "Remember: this is a light automated scan, not a penetration test."
            )
        else:
            executive_summary = (
                f"Your website security score is {int(score)}/100, which requires immediate attention. "
                "There are significant security and compliance issues that could put your business and customers at risk. "
                "We recommend addressing the critical and high-severity issues first. "
                "This scan checked for common security headers, HTTPS configuration, and basic compliance issues. "
                "Remember: this is a light automated scan, not a penetration test."
            )
        
        # Top 3 risks
        top_risks = []
        all_risks = critical_findings + high_findings + medium_findings
        for finding in all_risks[:3]:
            severity = finding.get("severity", "medium")
            title = finding.get("title", "Security issue")
            description = finding.get("description", "")
            
            if severity == "critical":
                risk_text = f"Critical: {title}. {description[:100]}..."
            elif severity == "high":
                risk_text = f"High Priority: {title}. {description[:100]}..."
            else:
                risk_text = f"Medium Priority: {title}. {description[:100]}..."
            
            top_risks.append(risk_text)
        
        # Fill with defaults if needed
        while len(top_risks) < 3:
            top_risks.append("Review all findings in the report for additional security improvements.")
        
        # Quick wins (low/medium severity with simple fixes)
        quick_wins = []
        low_medium = [f for f in findings if f.get("severity") in ["low", "medium"]]
        for finding in low_medium[:3]:
            title = finding.get("title", "")
            recommendation = finding.get("recommendation", "")
            if recommendation:
                quick_wins.append(f"{title}: {recommendation[:80]}...")
            else:
                quick_wins.append(f"{title}: Review and implement recommended security headers.")
        
        # Fill with defaults if needed
        default_wins = [
            "Add security headers: Configure your web server to include security headers like X-Frame-Options and X-Content-Type-Options.",
            "Enable HTTPS: Ensure all traffic is redirected to HTTPS to protect user data.",
            "Review privacy policy: Make sure your privacy policy is easily accessible and up to date."
        ]
        while len(quick_wins) < 3:
            quick_wins.append(default_wins[len(quick_wins)])
        
        # Recommended next step
        if critical_findings:
            recommended_next_step = (
                "Start by fixing the critical issues identified in this report. These pose the highest risk "
                "to your website and should be addressed immediately. Consider consulting with a web developer "
                "if you're not comfortable making these changes yourself."
            )
        elif high_findings:
            recommended_next_step = (
                "Focus on addressing the high-priority security issues first. These can significantly improve "
                "your security posture. Many of these can be fixed by configuring your web server properly."
            )
        elif score < 70:
            recommended_next_step = (
                "Work through the findings systematically, starting with the highest severity items. "
                "Even small improvements can make a big difference in your overall security score."
            )
        else:
            recommended_next_step = (
                "Great job! Your security score is good. Continue monitoring and consider implementing "
                "the remaining recommendations to further strengthen your security posture."
            )
        
        return {
            "executive_summary": executive_summary,
            "top_risks": top_risks[:3],
            "quick_wins": quick_wins[:3],
            "recommended_next_step": recommended_next_step
        }


class OpenAILLMClient(LLMClient):
    """OpenAI implementation (placeholder)"""
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate using OpenAI (placeholder)"""
        # TODO: Implement OpenAI integration
        return await StubLLMClient().generate(prompt, **kwargs)
    
    async def generate_explanation(self, scan_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation using OpenAI (placeholder)"""
        # TODO: Implement OpenAI integration
        # For now, fallback to stub
        return await StubLLMClient().generate_explanation(scan_report)


class DeepSeekLLMClient(LLMClient):
    """DeepSeek implementation (placeholder)"""
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate using DeepSeek (placeholder)"""
        # TODO: Implement DeepSeek integration
        return await StubLLMClient().generate(prompt, **kwargs)
    
    async def generate_explanation(self, scan_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanation using DeepSeek (placeholder)"""
        # TODO: Implement DeepSeek integration
        # For now, fallback to stub
        return await StubLLMClient().generate_explanation(scan_report)


def get_llm_client() -> LLMClient:
    """Factory function to get the appropriate LLM client based on config"""
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        # Return OpenAI client if API key is set
        return OpenAILLMClient()
    elif provider == "deepseek" and settings.DEEPSEEK_API_KEY:
        # Return DeepSeek client if API key is set
        return DeepSeekLLMClient()
    else:
        # Default to stub
        return StubLLMClient()
