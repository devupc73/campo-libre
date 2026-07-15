from passlib.context import CryptContext

MAX_BCRYPT_PASSWORD_BYTES = 72

pwd_context = CryptContext(
    schemes=['bcrypt'],
    deprecated='auto',
)


def validate_password_length(password: str) -> None:
    if len(password.encode('utf-8')) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError('Password must not exceed 72 bytes')


def hash_password(password: str) -> str:
    validate_password_length(password)
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        validate_password_length(password)
    except ValueError:
        return False
    return pwd_context.verify(password, hashed_password)
