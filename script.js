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
                const charPreviewImage = document.getElementById('char-preview-image');
                charPreviewImage.src = characterData.profile_image_url || 'https://i.imgur.com/eBOs2hT.png';
                
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
            const finalResult = Math.floor(Math.random() * sides) + 1; // Calculate final result immediately

            let animationCount = 0;
            const animationFrames = 20; // Number of random numbers to show
            const animationInterval = 50; // Milliseconds between each random number display

            const animation = setInterval(() => {
                if (animationCount < animationFrames) {
                    // Display a random number during the animation
                    rollResult.textContent = Math.floor(Math.random() * sides) + 1;
                    animationCount++;
                } else {
                    // Stop animation and display final result
                    clearInterval(animation);
                    rollResult.textContent = finalResult;
                }
            }, animationInterval);
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

        const createStat = (label, value, className = '') => {
            const stat = document.createElement('div');
            stat.className = `stat ${className}`;
            stat.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value">${value}</span>`;
            return stat;
        };

        const levelMatch = data.class_and_level.match(/\d+/);
        const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
        const proficiencyBonus = getProficiencyBonus(level);

        // --- Character Info ---
        const infoSection = document.createElement('div');
        infoSection.className = 'character-section col-full character-info-section'; // Added character-info-section

        const profileImageContainer = document.createElement('div');
        profileImageContainer.className = 'profile-image-container';
        const imageUrl = data.profile_image_url || 'https://i.imgur.com/eBOs2hT.png'; // A placeholder image
        profileImageContainer.innerHTML = `<img src="${imageUrl}" alt="${data.character_name}'s profile image">`;
        infoSection.appendChild(profileImageContainer);

        const characterInfoText = document.createElement('div');
        characterInfoText.className = 'character-info-text';
        characterInfoText.innerHTML = `<h2>${data.character_name}</h2>`;

        const infoGrid = document.createElement('div');
        infoGrid.className = 'grid-3-col';
        infoGrid.appendChild(createStat('Player', data.player_name));
        infoGrid.appendChild(createStat('Class & Level', data.class_and_level));
        infoGrid.appendChild(createStat('Background', data.background));
        infoGrid.appendChild(createStat('Race', data.race));
        infoGrid.appendChild(createStat('Alignment', data.alignment));
        infoGrid.appendChild(createStat('XP', data.experience_points));
        infoGrid.appendChild(createStat('Proficiency Bonus', `+${proficiencyBonus}`));
        characterInfoText.appendChild(infoGrid);

        infoSection.appendChild(characterInfoText);
        container.appendChild(infoSection);

        // --- Ability Scores ---
        const abilityScoresSection = document.createElement('div');
        abilityScoresSection.className = 'character-section';
        abilityScoresSection.innerHTML = '<h3>Ability Scores</h3>';
        const abilityScores = data.ability_scores;
        const abilityModifiers = {};
        const abilityGrid = document.createElement('div');
        abilityGrid.className = 'grid-3-col';
        for (const ability of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
            const score = abilityScores[`${ability}_score`];
            const modifier = getAbilityModifier(score);
            abilityModifiers[ability] = modifier;
            const stat = createStat(ability.toUpperCase(), score, 'ability-stat');
            stat.innerHTML += `<span class="stat-modifier">${modifier >= 0 ? '+' : ''}${modifier}</span>`;
            abilityGrid.appendChild(stat);
        }
        abilityScoresSection.appendChild(abilityGrid);
        container.appendChild(abilityScoresSection);

        // --- Saving Throws ---
        const savingThrowsSection = document.createElement('div');
        savingThrowsSection.className = 'character-section';
        savingThrowsSection.innerHTML = '<h3>Saving Throws</h3>';
        const savingThrowGrid = document.createElement('div');
        savingThrowGrid.className = 'grid-3-col';
        for (const ability in abilityModifiers) {
            const isProficient = data.saving_throw_proficiencies.includes(ability);
            const save = abilityModifiers[ability] + (isProficient ? proficiencyBonus : 0);
            savingThrowGrid.appendChild(createStat(ability.toUpperCase(), `${save >= 0 ? '+' : ''}${save} ${isProficient ? '(P)' : ''}`));
        }
        savingThrowsSection.appendChild(savingThrowGrid);
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
        const skillsGrid = document.createElement('div');
        skillsGrid.className = 'grid-2-col';
        let perceptionModifier = 0;
        for (const skill in skills) {
            const ability = skills[skill];
            const proficiency = data.skill_proficiencies[skill] || "none";
            let skillMod = abilityModifiers[ability];
            if (proficiency === "proficient") skillMod += proficiencyBonus;
            if (proficiency === "expertise") skillMod += proficiencyBonus * 2;
            if (skill === 'perception') perceptionModifier = skillMod;
            const skillName = skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            skillsGrid.appendChild(createStat(skillName, `${skillMod >= 0 ? '+' : ''}${skillMod} ${proficiency !== 'none' ? `(${proficiency.charAt(0).toUpperCase()})` : ''}`));
        }
        skillsSection.appendChild(skillsGrid);
        container.appendChild(skillsSection);

        // --- Passive Perception ---
        const passivePerception = 10 + perceptionModifier;
        const passivePerceptionSection = document.createElement('div');
        passivePerceptionSection.className = 'character-section';
        passivePerceptionSection.innerHTML = `<h3>Passive Perception</h3>`;
        passivePerceptionSection.appendChild(createStat('Passive Perception', passivePerception));
        container.appendChild(passivePerceptionSection);

        // --- Combat Stats ---
        const combatStatsSection = document.createElement('div');
        combatStatsSection.className = 'character-section';
        combatStatsSection.innerHTML = `<h3>Combat</h3>`;
        const combatGrid = document.createElement('div');
        combatGrid.className = 'grid-3-col';
        combatGrid.appendChild(createStat('Armor Class', data.armor_class || '10'));
        combatGrid.appendChild(createStat('Initiative', `${abilityModifiers.dex >= 0 ? '+' : ''}${abilityModifiers.dex}`));
        combatGrid.appendChild(createStat('Speed', `${data.speed} ft.`));
        combatStatsSection.appendChild(combatGrid);
        container.appendChild(combatStatsSection);

        // --- HP, Hit Dice, Death Saves ---
        const hpSection = document.createElement('div');
        hpSection.className = 'character-section';
        hpSection.innerHTML = `<h3>Hit Points</h3>`;
        const hpGrid = document.createElement('div');
        hpGrid.className = 'grid-3-col';
        hpGrid.appendChild(createStat('Max HP', data.hit_points.max_hp));
        hpGrid.appendChild(createStat('Current HP', data.hit_points.current_hp));
        hpGrid.appendChild(createStat('Temp HP', data.hit_points.temporary_hp));
        hpGrid.appendChild(createStat('Hit Dice', data.hit_dice.total));
        hpGrid.appendChild(createStat('Successes', data.death_saves.successes));
        hpGrid.appendChild(createStat('Failures', data.death_saves.failures));
        hpSection.appendChild(hpGrid);
        container.appendChild(hpSection);

        // --- Attacks & Spellcasting ---
        const attacksSection = document.createElement('div');
        attacksSection.className = 'character-section';
        attacksSection.innerHTML = '<h3>Attacks & Spellcasting</h3>';
        data.attacks_and_spellcasting.forEach(attack => {
            const attackEl = document.createElement('div');
            attackEl.className = 'attack';
            attackEl.innerHTML = `<span class="attack-name">${attack.name}</span><span class="attack-bonus">Atk: +${attack.attack_bonus}</span><span class="attack-damage">Dmg: ${attack.damage}</span>`;
            attacksSection.appendChild(attackEl);
        });
        container.appendChild(attacksSection);

        // --- Personality & Backstory ---
        const personalitySection = document.createElement('div');
        personalitySection.className = 'character-section';
        personalitySection.innerHTML = `<h3>Personality</h3>`;
        personalitySection.appendChild(createStat('Traits', data.personality_and_backstory.traits));
        personalitySection.appendChild(createStat('Ideals', data.personality_and_backstory.ideals));
        personalitySection.appendChild(createStat('Bonds', data.personality_and_backstory.bonds));
        personalitySection.appendChild(createStat('Flaws', data.personality_and_backstory.flaws));
        container.appendChild(personalitySection);

        // --- Features & Traits ---
        const featuresSection = document.createElement('div');
        featuresSection.className = 'character-section';
        featuresSection.innerHTML = '<h3>Features & Traits</h3>';
        data.features_and_traits.forEach(feature => {
            const featureEl = document.createElement('p');
            featureEl.textContent = feature;
            featuresSection.appendChild(featureEl);
        });
        container.appendChild(featuresSection);
    }
});