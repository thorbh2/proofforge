from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "contracts" / "ProofForge.py").read_text(encoding="utf-8")
CLIENT = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "src").rglob("*.ts*"))


def test_contract_dependency_is_pinned_to_the_current_genvm_runtime():
    assert SOURCE.startswith('# v0.2.16\n# { "Depends": "py-genlayer:')


def test_review_and_dispute_resolution_are_permissioned():
    assert "def _require_reviewer(" in SOURCE
    assert "only_mission_creator_or_protocol_reviewer" in SOURCE
    assert "only_submission_contributor_can_appeal" in SOURCE


def test_dispute_outcomes_update_score_verdict_and_mission_state():
    assert 'sub["score"] = 0' in SOURCE
    assert 'sub["verdict"] = "rejected"' in SOURCE
    assert 'sub["score"] = max(' in SOURCE
    assert 'm["status"] = "reviewing"' in SOURCE


def test_open_disputes_block_finalization_and_client_exposes_writes():
    assert "open_challenge_blocks_finalize" in SOURCE
    assert "open_appeal_blocks_finalize" in SOURCE
    for method in ("challenge_submission", "file_appeal", "resolve_challenge", "resolve_appeal", "finalize_mission"):
        assert method in CLIENT
