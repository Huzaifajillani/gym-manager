package com.gym.manager.repositories;

import com.gym.manager.models.DailyQrCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DailyQrCodeRepository extends MongoRepository<DailyQrCode, String> {
    Optional<DailyQrCode> findByDate(String date);
    Optional<DailyQrCode> findByQrToken(String qrToken);
}
