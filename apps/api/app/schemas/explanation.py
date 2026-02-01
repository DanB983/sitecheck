from pydantic import BaseModel
from typing import List


class ExplanationResponse(BaseModel):
    executive_summary: str
    top_risks: List[str]
    quick_wins: List[str]
    recommended_next_step: str

