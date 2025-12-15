package ru.mihozhereb.server.auth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CheckRequest(
        @NotNull @Min(-3) @Max(3) Double x,
        @NotNull @Min(-3) @Max(5) Double y,
        @NotNull @Min(1) @Max(3) Integer r
) {}