package com.galileo.auth.repository;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleInAndIsActiveTrueOrderByIdAsc(Collection<Role> roles);
    List<User> findByRoleAndIsActiveTrueOrderByIdAsc(Role role);
}
