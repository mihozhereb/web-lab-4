package ru.mihozhereb.server.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class TokenGenerator {
    private static final String ALPH = "0123456789abcdef";
    private final SecureRandom rnd = new SecureRandom();

    public String generate(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPH.charAt(rnd.nextInt(ALPH.length())));
        }
        return sb.toString();
    }
}