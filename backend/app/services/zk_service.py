"""ZK eligibility — stub prover/verifier matching the Node slice.

Real groth16 (snarkjs) lands later; this module only returns a placeholder
proof of the same shape so the API contract is stable.
"""
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import PoolType
from ..errors import Errors
from ..models import Pool, PoolMember

STUB_DEFAULT_MIN_RM = 500


class IncomeBelowThreshold(Exception):
    code = "INCOME_BELOW_THRESHOLD"


async def get_min_contribution_cents(session: AsyncSession, pool_id: str) -> int:
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    if pool.type != PoolType.FAMILY:
        raise Errors.conflict("ZK eligibility only applies to FAMILY pools")
    member_count = (await session.execute(
        select(func.count()).select_from(PoolMember).where(
            PoolMember.poolId == pool_id, PoolMember.isActive.is_(True)
        )
    )).scalar_one()
    if pool.targetAmount and member_count and member_count > 0:
        return int((float(pool.targetAmount) / member_count) * 100)
    return STUB_DEFAULT_MIN_RM * 100


def _random_field_element() -> str:
    return str(int.from_bytes(secrets.token_bytes(31), "big"))


async def generate_proof(session: AsyncSession, *, pool_id: str,
                         total_income_cents: int) -> dict[str, Any]:
    min_cents = await get_min_contribution_cents(session, pool_id)
    if total_income_cents < min_cents:
        raise IncomeBelowThreshold("Income does not meet the minimum contribution threshold")

    salt = secrets.token_hex(32)
    commitment_hash = "0x" + hashlib.sha256(f"{total_income_cents}:{salt}".encode()).hexdigest()
    proof = {
        "pi_a": [_random_field_element(), _random_field_element(), "1"],
        "pi_b": [
            [_random_field_element(), _random_field_element()],
            [_random_field_element(), _random_field_element()],
            ["1", "0"],
        ],
        "pi_c": [_random_field_element(), _random_field_element(), "1"],
        "protocol": "groth16-stub",
        "curve": "bn128",
    }
    return {"proof": proof, "publicSignals": [str(min_cents), commitment_hash], "commitmentHash": commitment_hash}


def verify_proof(proof: Any, public_signals: Any) -> bool:
    if not isinstance(proof, dict):
        return False
    pa, pb, pc = proof.get("pi_a"), proof.get("pi_b"), proof.get("pi_c")
    if not (isinstance(pa, list) and len(pa) == 3):
        return False
    if not (isinstance(pb, list) and len(pb) == 3):
        return False
    if not (isinstance(pc, list) and len(pc) == 3):
        return False
    if not (isinstance(public_signals, list) and len(public_signals) >= 2):
        return False
    return True


async def record_verification(session: AsyncSession, *, pool_id: str, user_id: str,
                              proof: Any, commitment_hash: str) -> PoolMember:
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.forbidden("Not a member of this pool")
    member.zkCommitmentHash = commitment_hash
    member.zkProof = proof
    member.zkVerified = True
    member.zkVerifiedAt = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(member)
    return member
