package com.gym.manager.controllers;

import com.gym.manager.models.Plan;
import com.gym.manager.services.PlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @GetMapping("/public")
    public ResponseEntity<List<Plan>> getPublicPlans() {
        return ResponseEntity.ok(planService.getAllActivePlans());
    }

    @GetMapping
    public ResponseEntity<List<Plan>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }

    @PostMapping
    public ResponseEntity<Plan> createPlan(@RequestBody Plan plan) {
        return ResponseEntity.ok(planService.createPlan(plan));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Plan> updatePlan(@PathVariable String id, @RequestBody Plan plan) {
        return ResponseEntity.ok(planService.updatePlan(id, plan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable String id) {
        planService.deletePlan(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Plan deactivated."));
    }
}
