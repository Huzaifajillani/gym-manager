package com.gym.manager.services;

import com.gym.manager.models.Addon;
import com.gym.manager.models.AddonOrder;
import com.gym.manager.models.Member;
import com.gym.manager.repositories.AddonOrderRepository;
import com.gym.manager.repositories.AddonRepository;
import com.gym.manager.repositories.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AddonService {

    private static final Logger log = LoggerFactory.getLogger(AddonService.class);

    private final AddonRepository addonRepository;
    private final AddonOrderRepository addonOrderRepository;
    private final MemberRepository memberRepository;

    public AddonService(AddonRepository addonRepository,
                        AddonOrderRepository addonOrderRepository,
                        MemberRepository memberRepository) {
        this.addonRepository = addonRepository;
        this.addonOrderRepository = addonOrderRepository;
        this.memberRepository = memberRepository;
    }

    public List<Addon> getAllAddons() {
        return addonRepository.findAll();
    }

    public List<Addon> getAddonsByCategory(String category) {
        return addonRepository.findByCategory(category);
    }

    public List<AddonOrder> getMemberOrders(String memberId) {
        return addonOrderRepository.findByMemberIdOrderByPurchasedAtDesc(memberId);
    }

    @Transactional
    public AddonOrder purchaseAddon(String memberId, String addonId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Addon addon = addonRepository.findById(addonId)
                .orElseThrow(() -> new IllegalArgumentException("Addon not found: " + addonId));

        int sessions = "PT".equalsIgnoreCase(addon.getCategory()) ? 10 : ("DIET".equalsIgnoreCase(addon.getCategory()) ? 4 : 1);

        AddonOrder order = new AddonOrder(
                member.getId(),
                addon.getId(),
                addon.getTitle(),
                addon.getCategory(),
                addon.getPrice(),
                "Active",
                sessions,
                sessions
        );

        AddonOrder saved = addonOrderRepository.save(order);
        log.info("Member {} purchased add-on '{}' for ${}", member.getName(), addon.getTitle(), addon.getPrice());
        return saved;
    }

    @Transactional
    public AddonOrder consumeSession(String orderId) {
        AddonOrder order = addonOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (order.getSessionsRemaining() > 0) {
            order.setSessionsRemaining(order.getSessionsRemaining() - 1);
            if (order.getSessionsRemaining() == 0) {
                order.setStatus("Completed");
            }
            return addonOrderRepository.save(order);
        }
        return order;
    }
}
