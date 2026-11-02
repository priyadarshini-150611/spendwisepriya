
package com.spendwise.dto;

import java.math.BigDecimal;

public record SmartInsightResponse(
    String title,
    String description,
    String category,
    BigDecimal amount
) {}
