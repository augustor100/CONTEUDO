(function (root, factory) {
  const library = (typeof module === "object" && module.exports)
    ? require("./ugc-library.js")
    : root.UGCLibrary;
  const api = factory(library || {});
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.UGCEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (LIBRARY) {
  "use strict";

  const FIRST_PERSON = ["eu ", "meu ", "minha ", "me ", "comigo", "pra mim", "para mim", "quando eu", "na minha"];

  function clean(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : fallback;
  }

  function lines(value) {
    if (Array.isArray(value)) return value.map(v => clean(v)).filter(Boolean);
    return clean(value).split(/\n|;|\|/).map(v => v.trim()).filter(Boolean);
  }

  function lowerFirst(value) {
    const text = clean(value);
    return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
  }

  function words(value, max = 12) {
    const all = clean(value).replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
    return all.slice(0, max).join(" ");
  }

  function libraryFormats() {
    return Array.isArray(LIBRARY.formats) ? LIBRARY.formats : [];
  }

  function findLibraryFormat(fragment, fallback) {
    const found = libraryFormats().find(item => clean(item).toLowerCase().includes(fragment.toLowerCase()));
    return found || fallback;
  }

  function audioFamily(name) {
    return Array.isArray(LIBRARY.audioHooks?.[name]) ? LIBRARY.audioHooks[name] : [];
  }

  function hasAudioPattern(family, fragment) {
    return audioFamily(family).some(item => clean(item).toLowerCase().includes(fragment.toLowerCase()));
  }

  function ctaFamily(name) {
    return Array.isArray(LIBRARY.ctas?.[name]) ? LIBRARY.ctas[name] : [];
  }

  function hasCTA(name, fragment) {
    return ctaFamily(name).some(item => clean(item).toLowerCase().includes(fragment.toLowerCase()));
  }

  function nicheType(b) {
    const source = `${b.niche} ${b.product}`.toLowerCase();
    if (/caldo|sopa|comida|aliment|padaria|restaurante|bebida|gastronom/.test(source)) return "food";
    if (/skincare|beleza|cosm|maquiagem|sérum|serum|protetor/.test(source)) return "beauty";
    if (/cabelo|capilar|shampoo|máscara/.test(source)) return "hair";
    if (/moda|roupa|vestido|calça|bolsa|sapato|acessório/.test(source)) return "fashion";
    if (/curso|serviço|consultoria|app|aplicativo|plataforma|software/.test(source)) return "service";
    if (/casa|limpeza|organizador|cozinha/.test(source)) return "home";
    return "general";
  }

  function productReference(b) {
    const source = `${b.niche} ${b.product}`.toLowerCase();
    if (/caldo/.test(source)) return "esse caldo";
    if (/sopa/.test(source)) return "essa sopa";
    if (/sérum|serum/.test(source)) return "esse sérum";
    if (/protetor/.test(source)) return "esse protetor";
    if (/máscara/.test(source)) return "essa máscara";
    if (/bolsa/.test(source)) return "essa bolsa";
    if (/calça/.test(source)) return "essa calça";
    if (/vestido/.test(source)) return "esse vestido";
    if (/consultoria/.test(source)) return "essa consultoria";
    if (/curso/.test(source)) return "esse curso";
    if (/app|aplicativo/.test(source)) return "esse aplicativo";
    return "esse produto";
  }


  function ofProduct(reference) {
    return clean(reference, "o produto")
      .replace(/^esse\s+/i, "desse ")
      .replace(/^essa\s+/i, "dessa ")
      .replace(/^este\s+/i, "deste ")
      .replace(/^esta\s+/i, "desta ");
  }

  function audienceLabel(b) {
    const type = nicheType(b);
    if (type === "food" && /caldo/.test(b.product.toLowerCase())) return "fã de caldos";
    if (type === "food") return "quem ama comida gostosa e prática";
    if (type === "beauty") return "quem gosta de skincare prático e resultado visível";
    if (type === "hair") return "quem cuida do cabelo e quer perceber diferença de verdade";
    if (type === "fashion") return "quem gosta de se vestir bem sem abrir mão da praticidade";
    if (type === "service") return "quem quer resolver isso com menos tentativa e erro";
    if (type === "home") return "quem quer uma rotina mais prática e organizada";
    return "quem procura uma solução que funcione de verdade na rotina";
  }

  function inferFormat(b) {
    if (b.format && b.format !== "Deixar o aplicativo escolher") return b.format;
    const type = nicheType(b);
    const objective = b.objective.toLowerCase();
    if (/ensinar/.test(objective)) return findLibraryFormat("tutorial de como usar", "Tutorial de como usar");
    if (/engajamento/.test(objective)) return findLibraryFormat("respostas a comentário", "Resposta a comentário");
    if (type === "food") return findLibraryFormat("sensorial", "Sensorial + review");
    if (type === "beauty" || type === "hair") return findLibraryFormat("vídeo demonstrativo", "Demonstração + experiência");
    if (type === "fashion") return findLibraryFormat("vlog", "Vlog + formas de usar");
    if (type === "service") return findLibraryFormat("benefícios e soluções", "Problema e solução + demonstração de tela");
    return findLibraryFormat("formato 1x1", "Conversa com amiga + problema e solução");
  }

  function inferQuestions(b) {
    const explicit = lines(b.productQuestions);
    if (explicit.length) return explicit;
    const type = nicheType(b);
    if (type === "food") return ["Chega bem apresentado?", "A porção é suficiente?", "A textura e o sabor parecem bons de verdade?"];
    if (type === "beauty") return ["Como fica na pele?", "É fácil de aplicar?", "A textura pesa ou fica pegajosa?"];
    if (type === "hair") return ["Como fica o cabelo depois?", "Pesa nos fios?", "É simples de usar na rotina?"];
    if (type === "fashion") return ["Como veste no corpo?", "O tecido e o acabamento parecem bons?", "Dá para usar em ocasiões diferentes?"];
    if (type === "service") return ["Como funciona na prática?", "Para quem faz sentido?", "Qual problema resolve e como começar?"];
    return ["Como funciona na prática?", "Para quem faz sentido?", "O benefício aparece no uso real?"];
  }

  function inferSensation(b) {
    if (b.sensation) return b.sensation;
    const type = nicheType(b);
    if (type === "food") return "aconchego, vontade de experimentar e sensação de refeição bem feita";
    if (type === "beauty" || type === "hair") return "autocuidado, confiança e satisfação com o resultado";
    if (type === "fashion") return "confiança, estilo e vontade de usar em diferentes momentos";
    if (type === "service") return "alívio, clareza e segurança para agir";
    return "praticidade, confiança e satisfação";
  }

  function inferMotive(b) {
    if (b.purchaseMotive) return b.purchaseMotive;
    const type = nicheType(b);
    if (type === "food") return "resolver uma refeição com praticidade sem abrir mão de sabor";
    if (type === "beauty" || type === "hair") return "obter um resultado percebido sem complicar a rotina";
    if (type === "fashion") return "sentir-se bem vestida com uma peça versátil e fácil de combinar";
    if (type === "service") return "economizar tempo e ter um caminho mais claro para resolver o problema";
    return "resolver uma necessidade real de forma simples";
  }

  function inferObjection(b) {
    if (b.objection) return b.objection;
    const type = nicheType(b);
    if (type === "food") return "medo de o produto chegar sem graça, pequeno ou diferente do que aparece na divulgação";
    if (type === "beauty" || type === "hair") return "medo de comprar e não perceber diferença ou não gostar da textura";
    if (type === "fashion") return "dúvida sobre caimento, qualidade e versatilidade";
    if (type === "service") return "dúvida sobre utilidade real, facilidade de uso e retorno do investimento";
    return "receio de investir e o produto não funcionar como esperado";
  }

  function inferProof(b) {
    if (b.proofAvailable) return b.proofAvailable;
    const type = nicheType(b);
    if (type === "food") return "mostrar embalagem, porção, vapor ou textura, colherada e reação ao experimentar";
    if (type === "beauty") return "mostrar textura, aplicação, absorção e acabamento em luz natural";
    if (type === "hair") return "mostrar aplicação, desembaraço, movimento e resultado final dos fios";
    if (type === "fashion") return "mostrar frente, costas, detalhe do tecido, caimento e pelo menos duas formas de usar";
    if (type === "service") return "mostrar tela, processo, antes e depois do fluxo ou exemplo real de uso";
    return "mostrar o produto em uso e o detalhe que comprova o benefício";
  }

  function normalizeBriefing(input) {
    const b = { ...input };
    b.brand = clean(b.brand, "a marca");
    b.product = clean(b.product, "o produto");
    b.niche = clean(b.niche, b.product);
    b.objective = clean(b.objective, "Apresentar o produto");
    b.distribution = clean(b.distribution, "Orgânico");
    b.platform = clean(b.platform, "Instagram Reels");
    b.durationSeconds = Math.min(Math.max(Number(b.durationSeconds) || 45, 15), 60);
    b.targetAudience = clean(b.targetAudience, "pessoas que enfrentam o problema descrito");
    b.mainPain = clean(b.mainPain, "uma dificuldade real da rotina");
    b.mainDesire = clean(b.mainDesire, `resolver ${lowerFirst(b.mainPain)} de forma mais simples`);
    b.differentiator = clean(b.differentiator, "um benefício claro no uso real");
    b.receivedBriefing = clean(b.receivedBriefing);
    b.restrictions = clean(b.restrictions);
    b.offerDetails = clean(b.offerDetails);
    b.brandLinks = lines(b.brandLinks);
    b.brandVisualNotes = clean(b.brandVisualNotes);
    b.brandAssetNames = Array.isArray(b.brandAssetNames) ? b.brandAssetNames : [];
    b.brandPalette = Array.isArray(b.brandPalette) ? b.brandPalette : [];
    b.hookPreference = clean(b.hookPreference, "Escolher automaticamente");
    b.includeBRoll = clean(b.includeBRoll, "Automático");
    b.ctaType = clean(b.ctaType, "Escolher automaticamente");
    b.format = inferFormat(b);
    b.productQuestions = inferQuestions(b);
    b.sensation = inferSensation(b);
    b.purchaseMotive = inferMotive(b);
    b.objection = inferObjection(b);
    b.proofAvailable = inferProof(b);
    b.authorityProof = clean(b.authorityProof, "experiência pessoal e demonstração real");
    b.productRef = productReference(b);
    b.audienceLabel = audienceLabel(b);
    b.type = nicheType(b);
    return b;
  }

  function visualOpening(type, b, variant = 0) {
    const product = b.productRef;
    const maps = {
      food: [
        ["Pegue uma colherada e levante-a devagar até a textura preencher a tela.", "a textura que me fez querer provar", "Primeira reação"],
        ["Comece com o pote fechado no centro da mesa. Abra a tampa dentro do enquadramento e deixe o vapor aparecer antes da fala.", "eu não esperava essa primeira impressão", "Efeito mesa"],
        ["Coloque o produto fora da tela e faça-o entrar pela lateral até parar bem perto da câmera. Corte imediatamente para a primeira colherada.", "olha isso antes de pedir", "Colocando na cena"]
      ],
      beauty: [
        ["Aproxime o aplicador da câmera, coloque uma pequena quantidade no dorso da mão e espalhe em um único movimento.", "a textura que eu queria ver antes", "Efeito mesa"],
        ["Comece com metade do rosto sem produto e metade já finalizada. Aponte para a diferença antes de falar.", "o detalhe que mudou o resultado", "Loop reverso"],
        ["Mostre o produto entrando no quadro por cima e pare a embalagem ao lado do rosto, sem esconder o rótulo.", "eu testei para você ver de perto", "Colocando na cena"]
      ],
      hair: [
        ["Comece puxando uma mecha para frente e mostre o movimento dos fios bem perto da câmera.", "como meu cabelo ficou na prática", "Primeira reação"],
        ["Mostre o produto aberto e passe o dedo na textura; corte para a aplicação na mecha.", "a textura já me chamou atenção", "Efeito mesa"],
        ["Faça um estalo de dedos e corte do cabelo antes para o resultado final, mantendo a mesma posição.", "do antes para o resultado", "Estralo dedo"]
      ],
      fashion: [
        ["Posicione o celular na vertical mostrando o corpo inteiro. Entre no quadro já usando a peça e faça uma volta curta.", "como essa peça veste de verdade", "Primeira reação"],
        ["Aproxime o tecido da lente, mostre costura e textura, depois afaste para revelar o look completo.", "o detalhe que eu sempre confiro", "Colocando x tirando câmera"],
        ["Comece segurando a peça no cabide e faça um corte no movimento para aparecer vestida com ela.", "eu queria ver isso no corpo", "Colocando na cena"]
      ],
      service: [
        ["Grave a tela mostrando o problema em dois segundos e, em seguida, toque no recurso que resolve a etapa.", "o caminho mais simples que eu encontrei", "Tela verde"],
        ["Use tela verde com a página do serviço atrás de você e aponte exatamente para o recurso que será mostrado.", "o que eu gostaria de ter sabido antes", "Tela verde"],
        ["Comece com um comentário ou pergunta na tela e responda apontando para ele.", "respondendo a dúvida que eu também tinha", "Caixinha de comentário"]
      ],
      general: [
        ["Coloque o produto no centro da mesa e faça sua mão entrar no quadro para pegá-lo enquanto a gravação já está acontecendo.", "o detalhe que eu precisava ver", "Efeito mesa"],
        ["Mostre primeiro o resultado final por dois segundos e só depois corte para você com o produto na mão.", "eu não esperava esse resultado", "Loop reverso"],
        ["Comece com um comentário na tela e aponte para ele antes de mostrar o produto.", "eu também queria saber isso", "Caixinha de comentário"]
      ]
    };
    const set = maps[type] || maps.general;
    const [action, screen, family] = set[variant % set.length];
    return { action, screen, product, family };
  }

  function auditoryLine(b, variant) {
    const benefit = lowerFirst(words(b.differentiator, 10));
    const familyByVariant = [
      "Ganchos De Curiosidade",
      "Ganchos Que Não Parecem Vendas",
      "Ganchos De Solução x Benefício"
    ];
    const family = familyByVariant[variant % familyByVariant.length];
    const pool = [
      hasAudioPattern(family, "Você precisa de") || hasAudioPattern(family, "Você é")
        ? `Se você é ${b.audienceLabel}, eu preciso te mostrar ${b.productRef} antes da sua próxima escolha.`
        : `Eu preciso te mostrar ${b.productRef} antes da sua próxima escolha.`,
      hasAudioPattern(family, "não tinha grandes expectativas") || hasAudioPattern(family, "me surpreendeu")
        ? `Eu achei que ${b.productRef} seria só mais um teste, mas ${benefit} me surpreendeu.`
        : `Eu testei ${b.productRef} sem grandes expectativas, mas me surpreendi.`,
      hasAudioPattern(family, "solução") || hasAudioPattern(family, "facilitou")
        ? `Eu queria que alguém tivesse me mostrado isso antes — eu teria evitado muita tentativa e erro.`
        : `Eu encontrei uma forma mais simples de resolver isso na minha rotina.`
    ];
    return { line: pool[variant % pool.length], family };
  }

  function hookTypes(b) {
    if (b.hookPreference === "Textual") return ["Textual", "Textual", "Textual"];
    if (b.hookPreference === "Visual") return ["Visual", "Visual", "Visual"];
    if (b.hookPreference === "Auditivo") return ["Auditivo", "Auditivo", "Auditivo"];
    return ["Textual", "Visual", "Auditivo"];
  }

  function hookScene(hook, seconds = "0–5s") {
    return {
      number: 1,
      element: "Gancho",
      seconds,
      spokenLine: hook.spokenLine || "",
      screenText: hook.onScreenText || "",
      recordSteps: hook.recordSteps || [],
      bRoll: hook.bRoll || "Não precisa de B-roll nesta abertura.",
      cutAfter: hook.cutAfter || "Corte assim que terminar a frase ou concluir a ação visual."
    };
  }

  function createHooks(b) {
    const types = hookTypes(b);
    const created = types.map((type, index) => {
      const visual = visualOpening(b.type, b, index);
      const auditory = auditoryLine(b, index);
      const spoken = auditory.line;
      if (type === "Visual") {
        return {
          type,
          text: visual.screen,
          spokenLine: index === 1 ? `Eu vi esse detalhe e precisei testar ${b.productRef}.` : `Eu quero te mostrar por que esse detalhe fez diferença pra mim.`,
          onScreenText: visual.screen,
          recordSteps: [
            "Deixe o celular na vertical e já comece gravando.",
            visual.action,
            "Espere a ação visual terminar e só então diga a frase."
          ],
          bRoll: "A própria abertura já funciona como imagem de apoio; não grave B-roll separado.",
          cutAfter: "Corte no fim da ação e passe direto para o problema.",
          sourceFamily: visual.family || "Gancho visual"
        };
      }
      if (type === "Auditivo") {
        return {
          type,
          text: spoken,
          spokenLine: spoken,
          onScreenText: words(spoken.replace(/^Eu\s+/i, ""), 7),
          recordSteps: [
            "Enquadre do peito para cima, com o produto visível ao lado do rosto.",
            "Olhe para a lente e diga a frase sem cumprimentar ou apresentar a marca.",
            "Faça uma pausa curta antes da parte mais importante da frase."
          ],
          bRoll: "Opcional: após a frase, corte para um detalhe do produto por um segundo.",
          cutAfter: "Corte imediatamente depois da palavra que entrega a surpresa.",
          sourceFamily: auditory.family || "Gancho auditivo"
        };
      }
      return {
        type,
        text: spoken,
        spokenLine: spoken,
        onScreenText: index === 0 ? `se você é ${b.audienceLabel}, olha isso` : words(spoken, 7),
        recordSteps: [
          "Posicione o celular na vertical, na altura dos olhos, mostrando você do peito para cima.",
          `Segure ${b.productRef} na altura do ombro, sem cobrir seu rosto ou o rótulo.`,
          "Comece falando direto. Não diga “oi”, “gente” ou o nome da marca antes do gancho."
        ],
        bRoll: "Não precisa de B-roll durante a primeira frase.",
        cutAfter: "Corte assim que terminar a frase e entre na situação-problema.",
        sourceFamily: auditory.family || "Gancho textual/auditivo"
      };
    });
    if (b.includeBRoll === "Não usar") {
      created.forEach(hook => { hook.bRoll = "Não grave B-roll nesta cena."; });
    }
    return created;
  }

  function scenePlan(b, hooks) {
    const hook = hooks[0];
    const scenes = [hookScene(hook)];
    const pain = lowerFirst(words(b.mainPain, 15));
    const benefit = lowerFirst(words(b.differentiator, 14));
    const question = b.productQuestions[0] || "se funciona na prática";
    const motive = lowerFirst(words(b.purchaseMotive, 12));

    scenes.push({
      number: 2, element: "Problema", seconds: "5–11s",
      spokenLine: `O meu problema era ${pain}.`,
      screenText: "o problema que eu tinha",
      recordSteps: practicalProblemSteps(b),
      bRoll: bRollFor(b, "problem"),
      cutAfter: "Termine a frase olhando para o problema e corte no movimento para o produto."
    });

    scenes.push({
      number: 3, element: "Descoberta", seconds: "11–19s",
      spokenLine: `Foi aí que eu testei ${b.productRef}, da ${b.brand}, e o primeiro detalhe que me chamou atenção foi ${benefit}.`,
      screenText: "o primeiro diferencial",
      recordSteps: practicalDiscoverySteps(b),
      bRoll: bRollFor(b, "discovery"),
      cutAfter: "Corte quando o diferencial estiver claramente visível."
    });

    scenes.push({
      number: 4, element: "Demonstração", seconds: "19–29s",
      spokenLine: `Eu queria saber: ${lowerFirst(question).replace(/\?$/, "")}? Então eu mostrei na prática.`,
      screenText: "testando de verdade",
      recordSteps: practicalDemoSteps(b),
      bRoll: bRollFor(b, "demo"),
      cutAfter: "Finalize no momento em que o resultado estiver mais fácil de enxergar."
    });

    scenes.push({
      number: 5, element: "Resultado", seconds: "29–38s",
      spokenLine: `Pra mim, o melhor foi conseguir ${motive} e sentir ${lowerFirst(words(b.sensation, 8))}.`,
      screenText: "o que eu percebi",
      recordSteps: practicalResultSteps(b),
      bRoll: bRollFor(b, "result"),
      cutAfter: "Segure a reação por um segundo antes do último corte."
    });

    scenes.push({
      number: 6, element: "CTA", seconds: "38–45s",
      spokenLine: buildCTA(b),
      screenText: ctaScreen(b),
      recordSteps: [
        `Volte para o enquadramento do peito para cima e mantenha ${b.productRef} visível.`,
        "Olhe para a lente e diga a CTA em uma única frase.",
        "Aponte apenas uma vez para o local do link ou comentário; não repita o gesto."
      ],
      bRoll: "Opcional: use a tela do site ou o produto parado por um segundo após a fala.",
      cutAfter: "Deixe o texto da CTA na tela por mais um segundo e encerre."
    });

    if (b.includeBRoll === "Não usar") {
      scenes.forEach(scene => { scene.bRoll = "Não grave B-roll nesta cena."; });
    }

    if (b.durationSeconds <= 30) {
      const compact = [scenes[0], scenes[1], scenes[3], scenes[5]];
      compact.forEach((s, i) => { s.number = i + 1; });
      compact[0].seconds = "0–4s"; compact[1].seconds = "4–10s"; compact[2].seconds = "10–23s"; compact[3].seconds = "23–30s";
      return compact;
    }
    if (b.durationSeconds >= 60) {
      scenes.splice(5, 0, {
        number: 6, element: "Confiança", seconds: "38–50s",
        spokenLine: `Eu também prestei atenção em ${lowerFirst(words(b.objection, 12))}; por isso mostrei tudo de perto antes de recomendar.`,
        screenText: "sem esconder os detalhes",
        recordSteps: [
          "Mostre uma avaliação verdadeira, comentário autorizado ou detalhe do produto que responda à objeção.",
          "Faça um zoom lento no ponto que comprova a informação.",
          "Mantenha sua voz em off enquanto a evidência aparece."
        ],
        bRoll: "Use somente prova verdadeira e autorizada pela marca.",
        cutAfter: "Corte depois que a evidência ficar legível por pelo menos dois segundos."
      });
      scenes[6].number = 7; scenes[6].seconds = "50–60s";
    }
    return scenes;
  }

  function practicalProblemSteps(b) {
    if (b.type === "food") return ["Grave uma cena de dois segundos chegando à mesa ou abrindo a geladeira com expressão cansada.", "Corte para você sentada, olhando para a câmera.", "Diga a frase enquanto mostra que não quer cozinhar ou escolher qualquer refeição."];
    if (b.type === "beauty" || b.type === "hair") return ["Mostre em close o problema real em luz natural, sem filtro de beleza.", "Aponte uma única vez para o ponto que incomoda.", "Diga a frase olhando para a lente."];
    if (b.type === "fashion") return ["Mostre uma tentativa de look que não resolveu o que você queria.", "Olhe para o espelho por dois segundos.", "Diga a frase em voz off sobre essa imagem."];
    if (b.type === "service") return ["Grave a tela mostrando onde você ficava travada.", "Circule ou aponte o ponto exato do problema.", "Use a frase em voz off."];
    return ["Mostre o problema acontecendo em uma ação simples e real.", "Mantenha a cena por dois segundos.", "Diga a frase em voz off ou olhando para a câmera."];
  }

  function practicalDiscoverySteps(b) {
    if (b.type === "food") return ["Coloque o pote no centro da mesa e abra a tampa dentro do quadro.", "Aproxime a câmera o suficiente para mostrar porção, vapor e textura.", "Diga a frase em voz off enquanto abre e mostra o produto."];
    if (b.type === "beauty") return ["Mostre a embalagem por um segundo com o rótulo legível.", "Aplique uma pequena quantidade no dorso da mão ou no rosto.", "Diga a frase em voz off enquanto a textura aparece."];
    if (b.type === "hair") return ["Abra o produto e mostre a textura com os dedos.", "Aplique em uma mecha visível.", "Diga a frase em voz off durante a aplicação."];
    if (b.type === "fashion") return ["Mostre a peça no cabide por um segundo.", "Aproxime tecido, costura ou acabamento da câmera.", "Faça um corte para aparecer usando a peça enquanto termina a frase."];
    if (b.type === "service") return ["Mostre a página inicial ou tela principal.", "Toque no recurso que resolve o problema.", "Diga a frase em voz off acompanhando o movimento na tela."];
    return ["Mostre o produto inteiro com o rótulo ou função visível.", "Aproxime o principal diferencial da câmera.", "Diga a frase em voz off enquanto demonstra."];
  }

  function practicalDemoSteps(b) {
    if (b.type === "food") return ["Pegue uma colherada e mantenha a colher parada perto da câmera por um segundo.", "Mostre a textura caindo de volta para o prato ou pote.", "Experimente e grave sua primeira reação sem repetir a tomada várias vezes."];
    if (b.type === "beauty") return ["Espalhe o produto em um lado da pele, em plano próximo.", "Espere a absorção ou acabamento aparecer.", "Mostre os dois lados na mesma luz, sem filtro."];
    if (b.type === "hair") return ["Mostre a aplicação ou enxágue em plano próximo.", "Penteie uma mecha para mostrar desembaraço ou textura.", "Mostre o resultado com movimento dos fios na mesma luz."];
    if (b.type === "fashion") return ["Grave um plano de corpo inteiro de frente.", "Vire de lado e depois de costas, sem acelerar demais.", "Mostre um detalhe do tecido e uma segunda combinação."];
    if (b.type === "service") return ["Faça uma gravação de tela do início ao resultado.", "Mantenha cada toque visível e sem cortes desnecessários.", "Mostre o resultado final por dois segundos."];
    return ["Use o produto do começo ao fim dentro do enquadramento.", "Mostre o detalhe que comprova o benefício.", "Segure o resultado por dois segundos antes de cortar."];
  }

  function practicalResultSteps(b) {
    if (b.type === "food") return ["Volte para um plano do peito para cima com a comida em primeiro plano.", "Dê uma segunda colherada ou mostre a porção depois de provar.", "Diga a frase com a reação que você realmente teve."];
    if (b.type === "beauty" || b.type === "hair") return ["Mostre o resultado final em luz natural, sem filtro.", "Vire o rosto ou mova o cabelo lentamente para a câmera perceber o acabamento.", "Diga a frase em voz off sobre o resultado."];
    if (b.type === "fashion") return ["Caminhe dois passos em direção à câmera usando o look completo.", "Mostre uma segunda forma de usar ou um detalhe funcional.", "Diga a frase em voz off."];
    if (b.type === "service") return ["Mostre o antes e o depois da tarefa ou processo.", "Destaque o tempo ou etapa economizada, se for verdadeiro.", "Diga a frase em voz off."];
    return ["Mostre o resultado final de forma clara.", "Faça uma reação curta e natural.", "Diga a frase sem repetir benefícios já mostrados."];
  }

  function bRollFor(b, purpose) {
    if (b.includeBRoll === "Não usar") return "Não grave B-roll nesta cena.";
    const optional = b.includeBRoll === "Automático" ? "Opcional: " : "";
    const map = {
      problem: "um take de dois segundos da situação-problema",
      discovery: "close do produto, embalagem ou detalhe principal",
      demo: "detalhe do uso, textura, movimento ou tela",
      result: "resultado final, reação ou prova verdadeira"
    };
    return `${optional}${map[purpose] || "detalhe do produto"}.`;
  }

  function ctaCategory(b) {
    if (/paga/i.test(b.distribution)) return "ads";
    return "organic";
  }

  function buildCTA(b) {
    const paid = /paga/i.test(b.distribution);
    const hasOffer = Boolean(b.offerDetails);
    if (b.ctaType === "Comentar para receber o link") {
      return hasCTA("CTA Orgânico**", "comenta aqui embaixo")
        ? "Comenta “eu quero” aqui embaixo que eu te envio o link."
        : "Deixa um comentário que eu te envio o link.";
    }
    if (b.ctaType === "Salvar e compartilhar") {
      return hasCTA("CTA Orgânico**", "salva esse vídeo")
        ? "Salva este vídeo para lembrar e envia para alguém que também precisa ver isso."
        : "Salva e compartilha com alguém que vai gostar.";
    }
    if (b.ctaType === "Comprar") {
      return paid
        ? `Clica no botão para conferir ${ofProduct(b.productRef)}${hasOffer ? ` e aproveitar ${b.offerDetails}` : ""}.`
        : `Se você também ficou com vontade de testar, eu deixei o link ${ofProduct(b.productRef)} para você conferir.`;
    }
    if (b.ctaType === "Clicar no link") return `Eu deixei o link ${ofProduct(b.productRef)} para você ver todos os detalhes.`;
    if (/engajamento/i.test(b.objective)) return "Me conta nos comentários se você também usaria e salva para lembrar depois.";
    if (paid) {
      return hasCTA("CTA Ads**", "é muito fácil fazer o pedido")
        ? `É muito fácil conferir: clica no botão e veja todos os detalhes ${ofProduct(b.productRef)}${hasOffer ? ` — ${b.offerDetails}` : ""}.`
        : `Clica no botão e confere todos os detalhes ${ofProduct(b.productRef)}${hasOffer ? ` — ${b.offerDetails}` : ""}.`;
    }
    return hasCTA("CTA Orgânico**", "quer saber onde comprei")
      ? `Se você quiser ver mais detalhes, eu deixei o link ${ofProduct(b.productRef)} para conferir.`
      : `Confere os detalhes ${ofProduct(b.productRef)} no link.`;
  }

  function ctaScreen(b) {
    if (b.ctaType === "Comentar para receber o link") return "comente: eu quero";
    if (b.ctaType === "Salvar e compartilhar") return "salve e compartilhe";
    if (/paga/i.test(b.distribution)) return "clique e confira";
    return "link nos detalhes";
  }

  function coverIdeas(b) {
    if (b.type === "food") return [
      { title: "Eu pediria de novo?", photo: "Comida em primeiro plano, colher levantada mostrando a textura e seu rosto reagindo ao fundo." },
      { title: "Vale a pena?", photo: "Produto aberto visto de cima, com porção e textura bem visíveis." }
    ];
    if (b.type === "beauty" || b.type === "hair") return [
      { title: "Como ficou de verdade", photo: "Resultado em luz natural, produto ao lado do rosto ou cabelo e fundo simples." },
      { title: "Vale a pena?", photo: "Você aplicando o produto, com o detalhe da textura visível." }
    ];
    if (b.type === "fashion") return [
      { title: "Como veste no corpo", photo: "Look completo, corpo inteiro e texto curto ao lado sem cobrir a peça." },
      { title: "Eu usaria de novo?", photo: "Close seu segurando o produto e um segundo look ao fundo." }
    ];
    return [
      { title: "O que eu achei", photo: `Você usando ${b.productRef}, com o resultado ou principal detalhe visível.` },
      { title: "Vale a pena?", photo: `Produto em primeiro plano e você olhando para ele com expressão natural.` }
    ];
  }

  function styling(b) {
    if (b.type === "food") return { outfit: "Camiseta lisa, tricô leve ou camisa casual em tons neutros/quentes.", accessories: "Brincos discretos; use apenas prato, colher e guardanapo como elementos de cena." };
    if (b.type === "beauty" || b.type === "hair") return { outfit: "Blusa lisa em tom neutro, decote simples e cabelo/maquiagem coerentes com o resultado mostrado.", accessories: "Argolas pequenas ou brincos discretos; evite peças que reflitam muita luz." };
    if (b.type === "fashion") return { outfit: "Use uma base neutra para o produto ser o foco e prepare uma segunda combinação simples.", accessories: "Escolha no máximo dois acessórios que conversem com a peça." };
    if (b.type === "service") return { outfit: "Roupa lisa e alinhada, sem estampas pequenas que disputem atenção com a tela.", accessories: "Use apenas celular, notebook ou material necessário para demonstrar o serviço." };
    return { outfit: "Roupa lisa e coerente com o uso real do produto.", accessories: "Acessórios discretos e somente elementos necessários para a demonstração." };
  }

  function captions(b) {
    const organic = `Eu testei ${b.product} porque esse problema era real na minha rotina: ${lowerFirst(b.mainPain)}. No vídeo eu mostrei o que me chamou atenção e como ${lowerFirst(b.differentiator)} apareceu na prática. Salva para lembrar e confere os detalhes no link.`;
    const paid = `Eu testei ${b.product} para mostrar, sem esconder detalhes, como o benefício aparece na prática: ${lowerFirst(b.differentiator)}. Clique no link e confira todas as informações.`;
    return { organic, paid, recommended: /paga/i.test(b.distribution) ? paid : organic };
  }

  function auditFirstPerson(scenes) {
    const body = scenes.filter(s => s.number > 1 && s.element !== "CTA");
    const failed = body.filter(scene => !FIRST_PERSON.some(marker => ` ${scene.spokenLine.toLowerCase()} `.includes(marker)));
    return { passed: failed.length === 0, failedScenes: failed.map(s => s.number) };
  }

  function durationAnalysis(scenes, requested) {
    const wordCount = scenes.reduce((sum, scene) => sum + clean(scene.spokenLine).split(/\s+/).filter(Boolean).length, 0);
    const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.3));
    return {
      spokenWords: wordCount,
      estimatedSeconds,
      requestedSeconds: requested,
      status: Math.abs(estimatedSeconds - requested) <= 8 ? "Dentro da faixa" : estimatedSeconds > requested ? "Acima da duração" : "Abaixo da duração"
    };
  }

  function applyHook(result, hookIndex) {
    const index = Math.min(Math.max(Number(hookIndex) || 0, 0), result.hooks.length - 1);
    const hook = result.hooks[index];
    result.selectedHookIndex = index;
    result.selectedHook = hook.text;
    result.scenes[0] = hookScene(hook, result.scenes[0]?.seconds || "0–5s");
    return result;
  }

  function generate(input) {
    const b = normalizeBriefing(input);
    const hooks = createHooks(b);
    const scenes = scenePlan(b, hooks);
    const cap = captions(b);
    const style = styling(b);
    const answer = {
      version: "4.0",
      strategySummary: "Roteiro UGC processado internamente com gancho, problema, solução, demonstração, resultado e CTA. A interface exibe somente instruções prontas para gravação.",
      primaryObjective: b.objective,
      recommendedFormat: b.format,
      targetAudience: b.targetAudience,
      hooks,
      selectedHookIndex: 0,
      selectedHook: hooks[0].text,
      scenes,
      primaryCTA: buildCTA(b),
      organicCTA: /paga/i.test(b.distribution) ? `Se você quiser ver mais detalhes, eu deixei o link ${ofProduct(b.productRef)} para conferir.` : buildCTA(b),
      paidCTA: `Clica no botão e confere todos os detalhes ${ofProduct(b.productRef)}${b.offerDetails ? ` — ${b.offerDetails}` : ""}.`,
      caption: cap.recommended,
      captions: cap,
      coverIdeas: coverIdeas(b),
      coverTitle: coverIdeas(b)[0].title,
      stylingIdeas: style,
      mandatoryAnswers: {
        differentials: b.differentiator,
        possibleQuestions: b.productQuestions,
        sensation: b.sensation,
        purchaseMotive: b.purchaseMotive,
        targetAudience: b.targetAudience,
        objection: b.objection,
        proof: b.proofAvailable
      },
      brandReading: {
        visualIdentitySummary: b.brandVisualNotes || "Sem descrição visual adicionada; usar cenário simples e coerente com o produto.",
        palette: b.brandPalette,
        references: [...b.brandLinks, ...b.brandAssetNames],
        limitation: b.brandLinks.length ? "Na versão local, os links são registrados como referência, mas não são navegados automaticamente." : ""
      },
      durationAnalysis: durationAnalysis(scenes, b.durationSeconds),
      firstPersonAudit: auditFirstPerson(scenes),
      internalLibrary: {
        audioHooks: LIBRARY.sourceSummary?.audioHookCount || 0,
        visualFamilies: LIBRARY.sourceSummary?.visualCategoryCount || 0,
        ctas: LIBRARY.sourceSummary?.ctaCount || 0,
        formats: LIBRARY.sourceSummary?.formatCount || 0,
        hookFamiliesUsed: hooks.map(hook => hook.sourceFamily),
        formatSource: b.format,
        ctaSource: /paga/i.test(b.distribution) ? "CTA Ads / CTA Ambos" : "CTA Orgânico / CTA Ambos"
      },
      confidenceLabel: "Roteiro prático para teste e adaptação ao briefing real da marca."
    };
    return answer;
  }

  return {
    generate,
    applyHook,
    normalizeBriefing,
    createHookCandidates: createHooks,
    firstPersonAudit: auditFirstPerson,
    durationAnalysis,
    version: "4.0"
  };
});
