package com.gym.manager.services;

import com.gym.manager.config.JwtTokenProvider;
import com.gym.manager.dto.AuthRequest;
import com.gym.manager.dto.AuthResponse;
import com.gym.manager.models.Member;
import com.gym.manager.repositories.MemberRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(MemberRepository memberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse authenticate(AuthRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";

        // Find member by either email or phone
        Optional<Member> memberOpt = memberRepository.findByEmail(identifier.toLowerCase());
        if (memberOpt.isEmpty()) {
            memberOpt = memberRepository.findByPhone(identifier);
        }
        if (memberOpt.isEmpty()) {
            memberOpt = memberRepository.findByMemberCode(identifier.toUpperCase());
        }

        if (memberOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid login credentials. User not found.");
        }

        Member member = memberOpt.get();

        if (!passwordEncoder.matches(rawPassword, member.getPassword())) {
            throw new IllegalArgumentException("Invalid password. Please check your credentials.");
        }

        String token = jwtTokenProvider.generateToken(
                member.getEmail(),
                member.getRole(),
                member.getId(),
                member.getName(),
                member.getMemberCode()
        );

        return new AuthResponse(
                token,
                member.getRole(),
                member.getId(),
                member.getName(),
                member.getMemberCode(),
                member.getEmail(),
                member.getPhone()
        );
    }
}
