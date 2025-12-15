package ru.mihozhereb.server.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 64) String login,
        @NotBlank @Size(min = 63, max = 65) String passwordHash
) {}
