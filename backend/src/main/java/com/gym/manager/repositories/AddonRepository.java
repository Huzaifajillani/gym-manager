package com.gym.manager.repositories;

import com.gym.manager.models.Addon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonRepository extends MongoRepository<Addon, String> {
    List<Addon> findByCategory(String category);
}
