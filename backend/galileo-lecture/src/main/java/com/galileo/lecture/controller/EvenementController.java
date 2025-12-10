package com.galileo.lecture.controller;

import com.galileo.lecture.dto.EvenementDTO;
import com.galileo.lecture.service.EvenementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EvenementController {

    private final EvenementService evenementService;

    @GetMapping
    public ResponseEntity<List<EvenementDTO>> listerEvenements() {
        log.info("Récupération de tous les événements");
        return ResponseEntity.ok(evenementService.obtenirTousLesEvenements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementDTO> obtenirEvenement(@PathVariable Long id) {
        log.info("Récupération de l'événement ID: {}", id);
        return ResponseEntity.ok(evenementService.obtenirEvenementParId(id));
    }

    @GetMapping("/a-venir")
    public ResponseEntity<List<EvenementDTO>> obtenirEvenementsAVenir() {
        log.info("Récupération des événements à venir");
        return ResponseEntity.ok(evenementService.obtenirEvenementsAVenir());
    }

    @GetMapping("/passes")
    public ResponseEntity<List<EvenementDTO>> obtenirEvenementsPasses() {
        log.info("Récupération des événements passés");
        return ResponseEntity.ok(evenementService.obtenirEvenementsPasses());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<EvenementDTO>> obtenirEvenementsParType(@PathVariable String type) {
        log.info("Récupération des événements par type: {}", type);
        return ResponseEntity.ok(evenementService.obtenirEvenementsParType(type));
    }
}
