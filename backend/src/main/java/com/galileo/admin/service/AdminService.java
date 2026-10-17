package com.galileo.admin.service;

import com.galileo.admin.dto.AdminStatsDTO;
import com.galileo.admin.dto.AdminUserDTO;
import com.galileo.auth.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.galileo.publications.entity.Domain;
import java.util.List;
import java.util.Map;

public interface AdminService {

    AdminStatsDTO getPlatformStats();

    Page<AdminUserDTO> listUsers(Pageable pageable);

    void updateUserRole(Long userId, Role role);

    void toggleUserStatus(Long userId, boolean isActive);

    List<Domain> listDomains();

    Domain createDomain(Domain domain);

    Domain updateDomain(Long id, Domain domain);

    void deleteDomain(Long id);

    Map<String, Object> getAiQuotas();

    void updateAiQuotas(Map<String, Object> quotas);
}
