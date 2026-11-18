package com.gym.manager.repositories;

import com.gym.manager.models.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByTransactionRef(String transactionRef);
    List<Payment> findAllByOrderByPaymentDateDesc();
    List<Payment> findByMemberIdOrderByPaymentDateDesc(String memberId);
    List<Payment> findByStatus(String status);
}
