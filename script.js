document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const charPreview = document.getElementById('char-preview');
    const charPreviewInfo = document.getElementById('char-preview-info');
    const joinButton = document.getElementById('join-button');
    const loginError = document.getElementById('login-error');

    const characterSheetContainer = document.getElementById('character-sheet-container');
    const hostModeContainer = document.getElementById('host-mode-container');
    const hostPlayerList = document.getElementById('host-player-list');
    const hostCharacterSheet = document.getElementById('host-character-sheet');
    const diceRollerContainer = document.getElementById('dice-roller-container');

    let currentPlayerId = null;

    // Page detection
    if (loginForm) {
        // --- LOGIN PAGE LOGIC ---
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const playerId = event.target['player-id'].value;
            loginError.textContent = '';

            if (playerId.toUpperCase() === 'DK') {
                window.location.href = 'sheet.html?mode=host';
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/character/${playerId}`);
                if (!response.ok) {
                    throw new Error('Character not found');
                }
                const characterData = await response.json();
                
                charPreviewInfo.textContent = `${characterData.character_name} - ${characterData.class_and_level}`;
                loginContainer.style.display = 'none';
                charPreview.style.display = 'block';
                currentPlayerId = playerId;

            } catch (error) {
                loginError.textContent = error.message;
            }
        });

        joinButton.addEventListener('click', () => {
            if (currentPlayerId) {
                window.location.href = `sheet.html?player_id=${currentPlayerId}`;
            }
        });

    } else {
        // --- SHEET PAGE LOGIC ---
        const urlParams = new URLSearchParams(window.location.search);
        const playerId = urlParams.get('player_id');
        const mode = urlParams.get('mode');

        if (mode === 'host') {
            initializeHostMode();
        } else if (playerId) {
            loadCharacterSheet(playerId);
        }

        // Dice Roller Logic
        const rollButton = document.getElementById('roll-button');
        const diceSelect = document.getElementById('dice-select');
        const rollResult = document.getElementById('roll-result');

        rollButton.addEventListener('click', () => {
            const sides = parseInt(diceSelect.value, 10);
            const result = Math.floor(Math.random() * sides) + 1;
            rollResult.textContent = result;
        });
    }

    async function loadCharacterSheet(playerId) {
        try {
            const response = await fetch(`http://localhost:8000/character/${playerId}`);
            if (!response.ok) {
                throw new Error('Character not found');
            }
            const characterData = await response.json();
            displayCharacterSheet(characterData, characterSheetContainer);
            characterSheetContainer.style.display = 'grid';
            diceRollerContainer.style.display = 'block';
        } catch (error) {
            characterSheetContainer.innerHTML = `<p class="error">${error.message}</p>`;
            characterSheetContainer.style.display = 'block';
        }
    }

    async function initializeHostMode() {
        hostModeContainer.style.display = 'flex';
        diceRollerContainer.style.display = 'block';

        try {
            const response = await fetch('http://localhost:8000/characters');
            const characters = await response.json();
            hostPlayerList.innerHTML = '<h3>Players</h3>';
            characters.forEach(char => {
                const playerLink = document.createElement('a');
                playerLink.href = '#';
                playerLink.textContent = char.character_name;
                playerLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const charResponse = await fetch(`http://localhost:8000/character/${char.id}`);
                    const charData = await charResponse.json();
                    displayCharacterSheet(charData, hostCharacterSheet);
                });
                hostPlayerList.appendChild(playerLink);
            });
        } catch (error) {
            hostPlayerList.innerHTML = '<p class="error">Failed to load players.</p>';
        }
    }

    function displayCharacterSheet(data, container) {
        container.innerHTML = ''; // Clear previous data

        // --- Helper functions ---
        const getAbilityModifier = (score) => Math.floor((score - 10) / 2);
        const getProficiencyBonus = (level) => 2 + Math.floor((level - 1) / 4);

        const levelMatch = data.class_and_level.match(/\d+/);
        const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
        const proficiencyBonus = getProficiencyBonus(level);

        // --- Character Info ---
        const infoSection = document.createElement('div');
        infoSection.className = 'character-section';
        infoSection.innerHTML = `<h2>${data.character_name}</h2>
            <p><strong>Player:</strong> ${data.player_name}</p>
            <p><strong>Class & Level:</strong> ${data.class_and_level}</p>
            <p><strong>Background:</strong> ${data.background}</p>
            <p><strong>Race:</strong> ${data.race}</p>
            <p><strong>Alignment:</strong> ${data.alignment}</p>
            <p><strong>XP:</strong> ${data.experience_points}</p>
            <p><strong>Proficiency Bonus:</strong> +${proficiencyBonus}</p>`;
        container.appendChild(infoSection);

        // --- Ability Scores ---
        const abilityScoresSection = document.createElement('div');
        abilityScoresSection.className = 'character-section';
        abilityScoresSection.innerHTML = '<h3>Ability Scores</h3>';
        const abilityScores = data.ability_scores;
        const abilityModifiers = {};
        for (const ability of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
            const score = abilityScores[`${ability}_score`];
            const modifier = getAbilityModifier(score);
            abilityModifiers[ability] = modifier;
            abilityScoresSection.innerHTML += `<p><strong>${ability.toUpperCase()}:</strong> ${score} (${modifier >= 0 ? '+' : ''}${modifier})</p>`;
        }
        container.appendChild(abilityScoresSection);

        // --- Saving Throws ---
        const savingThrowsSection = document.createElement('div');
        savingThrowsSection.className = 'character-section';
        savingThrowsSection.innerHTML = '<h3>Saving Throws</h3>';
        for (const ability in abilityModifiers) {
            const isProficient = data.saving_throw_proficiencies.includes(ability);
            const save = abilityModifiers[ability] + (isProficient ? proficiencyBonus : 0);
            savingThrowsSection.innerHTML += `<p><strong>${ability.toUpperCase()}:</strong> ${save >= 0 ? '+' : ''}${save} ${isProficient ? '(P)' : ''}</p>`;
        }
        container.appendChild(savingThrowsSection);

        // --- Skills ---
        const skills = {
            acrobatics: "dex", animal_handling: "wis", arcana: "int", athletics: "str", deception: "cha",
            history: "int", insight: "wis", intimidation: "cha", investigation: "int", medicine: "wis",
            nature: "int", perception: "wis", performance: "cha", persuasion: "cha", religion: "int",
            sleight_of_hand: "dex", stealth: "dex", survival: "wis"
        };
        const skillsSection = document.createElement('div');
        skillsSection.className = 'character-section';
        skillsSection.innerHTML = '<h3>Skills</h3>';
        let perceptionModifier = 0;
        for (const skill in skills) {
            const ability = skills[skill];
            const proficiency = data.skill_proficiencies[skill] || "none";
            let skillMod = abilityModifiers[ability];
            if (proficiency === "proficient") skillMod += proficiencyBonus;
            if (proficiency === "expertise") skillMod += proficiencyBonus * 2;
            if (skill === 'perception') perceptionModifier = skillMod;
            skillsSection.innerHTML += `<p><strong>${skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${skillMod >= 0 ? '+' : ''}${skillMod} ${proficiency !== 'none' ? `(${proficiency.charAt(0).toUpperCase()})` : ''}</p>`;
        }
        container.appendChild(skillsSection);

        // --- Passive Perception ---
        const passivePerception = 10 + perceptionModifier;
        const passivePerceptionSection = document.createElement('div');
        passivePerceptionSection.className = 'character-section';
        passivePerceptionSection.innerHTML = `<h3>Passive Perception</h3><p>${passivePerception}</p>`;
        container.appendChild(passivePerceptionSection);

        // --- Combat Stats ---
        const combatStatsSection = document.createElement('div');
        combatStatsSection.className = 'character-section';
        combatStatsSection.innerHTML = `<h3>Combat</h3>
            <p><strong>Armor Class:</strong> ${data.armor_class || '10'}</p>
            <p><strong>Initiative:</strong> ${abilityModifiers.dex >= 0 ? '+' : ''}${abilityModifiers.dex}</p>
            <p><strong>Speed:</strong> ${data.speed} ft.</p>`;
        container.appendChild(combatStatsSection);

        // --- HP, Hit Dice, Death Saves ---
        const hpSection = document.createElement('div');
        hpSection.className = 'character-section';
        hpSection.innerHTML = `<h3>Hit Points</h3>
            <p><strong>Max HP:</strong> ${data.hit_points.max_hp}</p>
            <p><strong>Current HP:</strong> ${data.hit_points.current_hp}</p>
            <p><strong>Temporary HP:</strong> ${data.hit_points.temporary_hp}</p>
            <p><strong>Hit Dice:</strong> ${data.hit_dice.total}</p>
            <p><strong>Death Saves:</strong> Successes: ${data.death_saves.successes}, Failures: ${data.death_saves.failures}</p>`;
        container.appendChild(hpSection);

        // --- Attacks & Spellcasting ---
        const attacksSection = document.createElement('div');
        attacksSection.className = 'character-section';
        attacksSection.innerHTML = '<h3>Attacks & Spellcasting</h3>';
        data.attacks_and_spellcasting.forEach(attack => {
            attacksSection.innerHTML += `<p><strong>${attack.name}:</strong> Atk: +${attack.attack_bonus}, Dmg: ${attack.damage}</p>`;
        });
        container.appendChild(attacksSection);

        // --- Personality & Backstory ---
        const personalitySection = document.createElement('div');
        personalitySection.className = 'character-section';
        personalitySection.innerHTML = `<h3>Personality</h3>
            <p><strong>Traits:</strong> ${data.personality_and_backstory.traits}</p>
            <p><strong>Ideals:</strong> ${data.personality_and_backstory.ideals}</p>
            <p><strong>Bonds:</strong> ${data.personality_and_backstory.bonds}</p>
            <p><strong>Flaws:</strong> ${data.personality_and_backstory.flaws}</p>`;
        container.appendChild(personalitySection);

        // --- Features & Traits ---
        const featuresSection = document.createElement('div');
        featuresSection.className = 'character-section';
        featuresSection.innerHTML = '<h3>Features & Traits</h3>';
        data.features_and_traits.forEach(feature => {
            featuresSection.innerHTML += `<p>${feature}</p>`;
        });
        container.appendChild(featuresSection);
    }
});