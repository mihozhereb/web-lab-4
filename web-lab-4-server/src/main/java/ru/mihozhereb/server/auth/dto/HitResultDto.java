package ru.mihozhereb.server.auth.dto;

import java.time.Instant;

public record HitResultDto(double x, double y, int r, boolean hit, Instant ts) {}