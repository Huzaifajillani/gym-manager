package com.gym.manager.repositories;

import com.gym.manager.models.AddonOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonOrderRepository extends MongoRepository<AddonOrder, String> {
    List<AddonOrder> findByMemberIdOrderByPurchasedAtDesc(String memberId);
}
