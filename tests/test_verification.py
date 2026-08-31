import pytest
from src.core.verification import VerificationGate, PurifiedArtifact
import dataclasses

def test_5t_seal_and_verify():
    """Test that a properly sealed artifact passes the 5T gate."""
    gate = VerificationGate()
    content = {"script": "Welcome to AI Station"}
    artifact = gate.seal(
        content=content,
        source_origin="test_agent_07",
        evidence={"test_test_run": "success"}
    )
    
    artifact_dict = dataclasses.asdict(artifact)
    is_valid, error = gate.verify_5t(artifact_dict)
    assert is_valid is True
    assert error is None

def test_5t_fail_trustworthy():
    """Test failure when hash_lock is tampered with."""
    gate = VerificationGate()
    artifact = gate.seal(
        content="Original Content",
        source_origin="origin_1",
        evidence={"hash_test": "ok"}
    )
    
    artifact_dict = dataclasses.asdict(artifact)
    # Tamper with content without updating hash
    artifact_dict['content'] = "Tampered Content"
    
    is_valid, error = gate.verify_5t(artifact_dict)
    assert is_valid is False
    assert "Trustworthy Error" in error

def test_5t_fail_tangible():
    """Test failure when evidence is missing."""
    gate = VerificationGate()
    artifact_dict = {
        "uuid": "123",
        "timestamp": 12345,
        "version": "v1",
        "content": "some content",
        "source_origin": "origin_1",
        "hash_lock": "wrong-hash",
        "evidence": None # Should be a dict
    }
    is_valid, error = gate.verify_5t(artifact_dict)
    assert is_valid is False
    assert "Tangible Error" in error

def test_5t_fail_traceable():
    """Test failure when source_origin is missing."""
    gate = VerificationGate()
    artifact_dict = {
        "uuid": "123",
        "timestamp": 12345,
        "version": "v1",
        "content": "some content",
        "hash_lock": "any-hash",
        "evidence": {}
    }
    # Missing source_origin
    is_valid, error = gate.verify_5t(artifact_dict)
    assert is_valid is False
    assert "Traceable Error" in error
