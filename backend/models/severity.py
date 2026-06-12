from .schemas import Verdict

SEVERITY_WEIGHTS = {
    "CRITICAL": 30,
    "HIGH": 15,
    "MEDIUM": 5,
}

VERDICT_THRESHOLDS = {
    "DO_NOT_PROCEED": 80,
    "PROCEED_WITH_CAUTION": 50,
    "PROCEED": 0,
}


def calculate_risk_score(vulnerabilities: list[dict]) -> int:
    base = sum(SEVERITY_WEIGHTS.get(v["severity"], 0) for v in vulnerabilities)

    critical_agents = len(set(
        v["agent"] for v in vulnerabilities if v["severity"] == "CRITICAL"
    ))
    if critical_agents >= 2:
        base += 10

    high_agents = len(set(
        v["agent"] for v in vulnerabilities if v["severity"] == "HIGH"
    ))
    if high_agents >= 3:
        base += 5

    return min(base, 100)


def get_verdict(risk_score: int) -> Verdict:
    if risk_score >= VERDICT_THRESHOLDS["DO_NOT_PROCEED"]:
        return Verdict.DO_NOT_PROCEED
    if risk_score >= VERDICT_THRESHOLDS["PROCEED_WITH_CAUTION"]:
        return Verdict.PROCEED_WITH_CAUTION
    return Verdict.PROCEED
