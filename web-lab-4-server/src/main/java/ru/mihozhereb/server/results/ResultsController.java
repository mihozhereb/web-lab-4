package ru.mihozhereb.server.results;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import ru.mihozhereb.server.auth.dto.CheckRequest;
import ru.mihozhereb.server.auth.dto.HitResultDto;
import ru.mihozhereb.server.domain.HitResult;
import ru.mihozhereb.server.domain.HitResultRepository;
import ru.mihozhereb.server.domain.User;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ResultsController {

    private final HitResultRepository repo;
    private final AreaService areaService;

    public ResultsController(HitResultRepository repo, AreaService areaService) {
        this.repo = repo;
        this.areaService = areaService;
    }

    @GetMapping("/results")
    public List<HitResultDto> list(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return repo.findAllByUserIdOrderByTsDesc(user.getId())
                .stream()
                .map(r -> new HitResultDto(r.getX(), r.getY(), r.getR(), r.isHit(), r.getTs()))
                .toList();
    }

    @PostMapping("/area/check")
    public HitResultDto check(@Valid @RequestBody CheckRequest req, Authentication auth) {
        User user = (User) auth.getPrincipal();

        boolean hit = areaService.isHit(req.x(), req.y(), req.r());

        HitResult entity = new HitResult();
        entity.setUser(user);
        entity.setX(req.x());
        entity.setY(req.y());
        entity.setR(req.r());
        entity.setHit(hit);
        entity.setTs(Instant.now());
        repo.save(entity);

        return new HitResultDto(entity.getX(), entity.getY(), entity.getR(), entity.isHit(), entity.getTs());
    }

    @Transactional
    @PostMapping("/results/clear")
    public void clear(Authentication auth) {
        User user = (User) auth.getPrincipal();
        repo.deleteAllByUserId(user.getId());
    }
}