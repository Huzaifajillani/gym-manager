package com.gym.manager.services;

import com.gym.manager.models.Plan;
import com.gym.manager.repositories.PlanRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanService {

    private final PlanRepository planRepository;

    public PlanService(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    public List<Plan> getAllActivePlans() {
        return planRepository.findByIsActiveTrue();
    }

    public List<Plan> getAllPlans() {
        return planRepository.findAll();
    }

    public Plan getPlanById(String id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + id));
    }

    public Plan createPlan(Plan plan) {
        return planRepository.save(plan);
    }

    public Plan updatePlan(String id, Plan planDetails) {
        Plan plan = getPlanById(id);
        plan.setName(planDetails.getName());
        plan.setDurationMonths(planDetails.getDurationMonths());
        plan.setPrice(planDetails.getPrice());
        plan.setDiscount(planDetails.getDiscount());
        plan.setBenefits(planDetails.getBenefits());
        plan.setActive(planDetails.isActive());
        return planRepository.save(plan);
    }

    public void deletePlan(String id) {
        Plan plan = getPlanById(id);
        plan.setActive(false);
        planRepository.save(plan);
    }
}
