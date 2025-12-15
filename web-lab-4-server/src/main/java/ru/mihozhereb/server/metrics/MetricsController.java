package ru.mihozhereb.server.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.micrometer.metrics.actuate.endpoint.MetricsEndpoint;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsEndpoint metrics;

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> res = new HashMap<>();

        res.put("uptime", value("process.uptime"));
        res.put("jvmUsedMemory", value("jvm.memory.used"));
        res.put("httpRequests", value("http.server.requests"));

        return res;
    }

    private Double value(String name) {
        var m = metrics.metric(name, null);
        if (m == null || m.getMeasurements().isEmpty()) return null;
        return m.getMeasurements().get(0).getValue();
    }
}