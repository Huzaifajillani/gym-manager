package com.gym.manager.repositories;

import com.gym.manager.models.Membership;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends MongoRepository<Membership, String> {
    Optional<Membership> findTopByMemberIdOrderByStartDateDesc(String memberId);
    List<Membership> findByMemberId(String memberId);
    List<Membership> findByExpiryDate(String expiryDate);
    List<Membership> findByExpiryDateBetween(String startDate, String endDate);
    List<Membership> findByPaymentStatus(String paymentStatus);
    long countByPaymentStatus(String paymentStatus);
}
