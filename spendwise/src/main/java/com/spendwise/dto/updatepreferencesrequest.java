
package com.spendwise.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdatePreferencesRequest {

    private Boolean notificationsEnabled;

    private Boolean budgetAlertsEnabled;

    private Boolean insightsEnabled;

    @NotBlank(message = "Theme is required")
    @Pattern(
        regexp = "light|dark",
        message = "Theme must be light or dark"
    )
    private String theme;

    public UpdatePreferencesRequest() {
    }

    public Boolean getNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(Boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public Boolean getBudgetAlertsEnabled() {
        return budgetAlertsEnabled;
    }

    public void setBudgetAlertsEnabled(Boolean budgetAlertsEnabled) {
        this.budgetAlertsEnabled = budgetAlertsEnabled;
    }

    public Boolean getInsightsEnabled() {
        return insightsEnabled;
    }

    public void setInsightsEnabled(Boolean insightsEnabled) {
        this.insightsEnabled = insightsEnabled;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }
}
