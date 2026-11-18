package com.gym.manager.repositories;

import com.gym.manager.models.Plan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanRepository extends MongoRepository<Plan, String> {
    List<Plan> findByIsActiveTrue();
}
