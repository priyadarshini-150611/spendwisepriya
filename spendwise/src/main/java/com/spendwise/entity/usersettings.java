
package com.spendwise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.CheckConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_settings",
    check = @CheckConstraint(
        name = "chk_user_settings_theme",
        constraint = "theme IN ('light', 'dark')"
    )
)
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "notifications_enabled", nullable = false)
    private Boolean notificationsEnabled = true;

    @Column(name = "budget_alerts_enabled", nullable = false)
    private Boolean budgetAlertsEnabled = true;

    @Column(name = "insights_enabled", nullable = false)
    private Boolean insightsEnabled = true;

    @Column(name = "theme", nullable = false, length = 20)
    private String theme = "light";

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public UserSettings() {
    }

    public Long getUserId() {
        return userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
