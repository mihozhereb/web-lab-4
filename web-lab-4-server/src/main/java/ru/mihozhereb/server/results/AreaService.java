package ru.mihozhereb.server.results;

import org.springframework.stereotype.Service;

@Service
public class AreaService {

    public boolean isHit(double x, double y, int r) {
        boolean inRect = x >= -r && x <= 0 && y >= 0 && y <= r;
        boolean inCircle = x >= 0 && y >= 0 && (x * x + y * y <= r * r + 1e-12);
        boolean inTri = x >= 0 && x <= r / 2.0 && y <= 0 && y >= -r / 2.0 && y >= x - r / 2.0 - 1e-12;
        return inRect || inCircle || inTri;
    }
}