
package com.spendwise.dto;

import java.math.BigDecimal;

public record CategorySpendingResponse(
    String category,
    BigDecimal total
) {}
