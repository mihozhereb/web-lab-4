package ru.mihozhereb.server.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HitResultRepository extends JpaRepository<HitResult, Long> {
    List<HitResult> findAllByUserIdOrderByTsDesc(Long userId);
    void deleteAllByUserId(Long userId);
}
