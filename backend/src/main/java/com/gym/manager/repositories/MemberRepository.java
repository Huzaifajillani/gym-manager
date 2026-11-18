package com.gym.manager.repositories;

import com.gym.manager.models.Member;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends MongoRepository<Member, String> {
    Optional<Member> findByEmail(String email);
    Optional<Member> findByPhone(String phone);
    Optional<Member> findByMemberCode(String memberCode);
    List<Member> findByStatus(String status);
    List<Member> findByRole(String role);
    long countByStatus(String status);
    long countByRole(String role);
}
