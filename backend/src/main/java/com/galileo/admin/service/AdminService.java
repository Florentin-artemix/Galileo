package com.galileo.admin.service;

import com.galileo.admin.dto.AdminStatsDTO;
import com.galileo.admin.dto.AdminUserDTO;
import com.galileo.auth.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    AdminStatsDTO getPlatformStats();

    Page<AdminUserDTO> listUsers(Pageable pageable);

    void updateUserRole(Long userId, Role role);

    void toggleUserStatus(Long userId, boolean isActive);
}
