from pydantic import BaseModel


class PaymentCreate(BaseModel):
    reservation_id: int | None = None
    participant_id: int | None = None
    payer_user_id: int | None = None
    receiver_user_id: int | None = None
    sports_complex_id: int | None = None
    payment_flow: str = 'player_to_captain'
    payment_type: str = 'contribution'
    method: str
    amount: float
    status: str = 'pending'
    reference: str | None = None


class PaymentRead(PaymentCreate):
    id: int

    class Config:
        from_attributes = True
