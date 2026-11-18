package com.gym.manager.repositories;

import com.gym.manager.models.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    List<Attendance> findByMemberIdOrderByCheckInTimeDesc(String memberId);
    List<Attendance> findByCheckInDateOrderByCheckInTimeDesc(String checkInDate);
    long countByCheckInDate(String checkInDate);
    Optional<Attendance> findTopByMemberIdOrderByCheckInTimeDesc(String memberId);
    List<Attendance> findTop20ByOrderByCheckInTimeDesc();
    boolean existsByMemberIdAndCheckInDate(String memberId, String checkInDate);
    List<Attendance> findByCheckInDateOrderByCheckInTimeAsc(String checkInDate);
}
