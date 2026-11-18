package com.gym.manager.repositories;

import com.gym.manager.models.NoShowCase;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoShowCaseRepository extends MongoRepository<NoShowCase, String> {
    Optional<NoShowCase> findByMemberIdAndStatusIn(String memberId, List<String> statuses);
    Optional<NoShowCase> findByMemberId(String memberId);
    List<NoShowCase> findByStatus(String status);
    List<NoShowCase> findByStatusIn(List<String> statuses);
    long countByStatus(String status);
}
