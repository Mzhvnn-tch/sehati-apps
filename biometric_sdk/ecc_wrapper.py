from reedsolo import RSCodec, ReedSolomonError
import os
import hashlib

class FuzzyCommitment:
    """
    Implements a Fuzzy Commitment Scheme using Reed-Solomon codes.
    
    Structure:
    - Secret S (k bytes)
    - ECC C (n bytes) = RS_Encode(S)
    - Biometric B (n bytes)
    - Helper H = C XOR B
    """
    
    def __init__(self, secret_size: int = 4, parity_bytes: int = 4):
        """
        secret_size: Size of the cryptographic secret (k)
        parity_bytes: Number of parity bytes added by RS (n - k)
        
        Note: The Biometric Vector must match the size of the encoded codeword (secret_size + parity_bytes).
        """
        self.secret_size = secret_size
        self.parity_bytes = parity_bytes
        self.rsc = RSCodec(parity_bytes) # n = k + parity
        self.codeword_len = secret_size + parity_bytes

    def commit(self, biometric_vector: bytes) -> tuple[bytes, bytes]:
        """
        Generates a fresh random secret, commits it to the biometric vector.
        Returns: (Secret, HelperData)
        """
        if len(biometric_vector) != self.codeword_len:
            raise ValueError(f"Biometric vector length {len(biometric_vector)} != Codeword length {self.codeword_len}. "
                             f"Please adjust feature extraction count.")

        # 1. Generate Uniformly Random Secret S
        secret = os.urandom(self.secret_size)
        
        # 2. Encode S -> C
        codeword = self.rsc.encode(secret) # This appends parity bytes
        # reedsolo output is bytearray, convert to bytes
        codeword = bytes(codeword)
        
        # 3. Helper H = C XOR B
        helper_data = bytearray(len(codeword))
        for i in range(len(codeword)):
            helper_data[i] = codeword[i] ^ biometric_vector[i]
            
        return secret, bytes(helper_data)

    def unlock(self, biometric_vector: bytes, helper_data: bytes) -> bytes:
        """
        Recovers the secret using the biometric vector and helper data.
        Returns: Secret S (if successful)
        Raises: ReedSolomonError (if too much noise)
        """
        if len(biometric_vector) != len(helper_data):
            raise ValueError("Size mismatch")

        # 1. Recover Noisy Codeword C' = H XOR B'
        noisy_codeword = bytearray(len(helper_data))
        for i in range(len(helper_data)):
            noisy_codeword[i] = helper_data[i] ^ biometric_vector[i]
            
        # 2. RS Decode C' -> S
        try:
            # decode returns (decoded_msg, decoded_msg_with_ecc, err_list)
            # we just want the message (secret)
            decoded_secret, _, _ = self.rsc.decode(noisy_codeword)
            return bytes(decoded_secret)
        except ReedSolomonError as e:
            # Here we could log the failure
            raise e
