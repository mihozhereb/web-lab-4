package ru.mihozhereb.server.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.mihozhereb.server.auth.dto.AuthResponse;
import ru.mihozhereb.server.auth.dto.LoginRequest;
import ru.mihozhereb.server.auth.dto.RegisterRequest;
import ru.mihozhereb.server.domain.User;
import ru.mihozhereb.server.domain.UserRepository;
import ru.mihozhereb.server.security.TokenGenerator;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final TokenGenerator tokenGenerator;

    public AuthController(UserRepository userRepository, TokenGenerator tokenGenerator) {
        this.userRepository = userRepository;
        this.tokenGenerator = tokenGenerator;
    }

    @PostMapping("/register")
    public void register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByLogin(req.login())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Логин уже занят");
        }
        User u = new User();
        u.setLogin(req.login());
        u.setPasswordHash(req.passwordHash());
        userRepository.save(u);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User u = userRepository.findByLogin(req.login())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));

        if (!u.getPasswordHash().equals(req.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }

        String token = tokenGenerator.generate(48);
        u.setToken(token);
        u.setTokenIssuedAt(Instant.now());
        userRepository.save(u);

        return new AuthResponse(token);
    }
}