# 영어 프롬프트가 더 나은 코드를 만드는 이유

AI 코딩 도구는 영어로 프롬프트를 입력할 때 더 잘 작동해요——영어가 모국어가 아니더라도요. [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) 플러그인이 프롬프트를 자동으로 교정하고, 번역하고, 다듬어 줘요.

## AI 코딩에서 영어가 중요한 이유

### LLM 은 영어로 사고해요

대규모 언어 모델은 모든 언어를 영어에 강하게 정렬된 표현 공간을 통해 내부적으로 처리해요.[^1] 영어가 아닌 프롬프트를 모델에 보내기 전에 영어로 미리 번역하면 출력 품질이 측정 가능한 수준으로 향상돼요.[^2]

실제로 중국어 프롬프트 "把这个函数改成异步的"도 작동하지만, 영어 표현 "Convert this function to async"가 더 정확한 코드를 더 적은 반복으로 생성해요.

### 도구 사용은 프롬프트 언어를 따라가요

AI 코딩 도구가 웹을 검색하거나, 문서를 읽거나, API 레퍼런스를 찾을 때 프롬프트의 언어로 쿼리를 수행해요. 영어 쿼리가 더 나은 결과를 찾는 이유는 다음과 같아요:

- 공식 문서, Stack Overflow, GitHub 이슈는 대부분 영어로 작성되어 있어요
- 기술 검색어는 영어로 더 정확해요
- 코드 예제와 에러 메시지는 거의 항상 영어예요

중국어 프롬프트로 "状态管理"를 검색하면 중국어 자료를 찾게 되어, 정식 영어 문서를 놓칠 수 있어요. 다국어 벤치마크에서는 영어와 다른 언어 사이에 최대 24% 의 성능 격차가 일관되게 나타나요——프랑스어나 독일어처럼 잘 지원되는 언어에서도요.[^3]

## `claude-english-buddy` 플러그인

`claude-english-buddy`는 모든 프롬프트를 가로채서 네 가지 모드 중 하나로 처리하는 Claude Code 플러그인이에요:

| 모드 | 트리거 | 동작 |
|------|--------|------|
| **교정** | 오류가 있는 영어 프롬프트 | 맞춤법/문법 수정, 변경 사항 표시 |
| **번역** | 비영어 감지 (CJK, 키릴 문자 등) | 영어로 번역, 번역 결과 표시 |
| **다듬기** | `::` 접두사 | 모호한 입력을 정확하고 구조화된 프롬프트로 재작성 |
| **건너뛰기** | 짧은 텍스트, 명령어, URL, 코드 | 변경 없이 그대로 전달 |

이 플러그인은 교정에 Claude Haiku를 사용해요——빠르고 저렴하며, 워크플로우를 전혀 방해하지 않아요.

### 자동 교정 (기본값)

평소처럼 입력하면 돼요. 플러그인이 언어를 자동으로 감지해요:

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

프롬프트가 깔끔하면——침묵이에요. 잡음 없이. 침묵은 곧 정확하다는 뜻이에요.

### 번역

영어가 아닌 프롬프트는 자동으로 번역돼요:

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### `::` 로 프롬프트 다듬기

프롬프트 앞에 `::` 를 붙이면 대략적인 아이디어를 정확한 프롬프트로 다듬어 줘요:

```
:: make the search faster it's really slow with big files
```

다음과 같이 변환돼요:

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

`::` 접두사는 어떤 언어에서든 작동해요——번역과 구조 재편을 한 번에 처리해요.[^4]

::: tip 플러그인이 침묵할 때
짧은 명령어(`yes`, `continue`, `option 2`), 슬래시 명령어, URL, 코드 스니펫은 변경 없이 그대로 전달돼요. 불필요한 왕복이 없어요.
:::

## 진행 상황 추적

플러그인은 모든 교정을 기록해요. 몇 주가 지나면 영어 실력이 향상되는 것을 확인할 수 있어요:

| 명령어 | 표시 내용 |
|--------|----------|
| `/claude-english-buddy:today` | 오늘의 교정, 반복되는 실수, 교훈, 추세 |
| `/claude-english-buddy:stats` | 장기 오류율 및 개선 추이 |
| `/claude-english-buddy:mistakes` | 누적 반복 패턴——취약 포인트 |

## 설정

Claude Code 에서 플러그인을 설치하세요:

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

추가 설정 없이——자동 교정이 바로 시작돼요.

### 선택적 설정

프로젝트 루트에 `.claude-english-buddy.json` 을 만들어서 커스터마이징할 수 있어요:

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| 설정 | 옵션 | 기본값 |
|------|------|--------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | 언어 이름 또는 비활성화하려면 `null` | `null` |
| `domain_terms` | 변경 없이 유지할 용어 배열 | `[]` |

`summary_language`를 설정하면, Claude 가 매 응답 끝에 해당 언어로 간략한 요약을 추가해요——주요 결정 사항을 모국어로 확인하고 싶을 때 유용해요.[^5]

[^1]: 다국어 LLM 은 입력/출력 언어에 관계없이 영어에 가장 가까운 표현 공간에서 핵심 결정을 내려요. 연구자들이 logit lens 를 사용해 내부 표현을 탐색한 결과, "water"나 "sun" 같은 의미가 풍부한 단어가 대상 언어로 번역되기 전에 영어로 먼저 선택된다는 것을 발견했어요. Activation steering 도 영어로 계산할 때 더 효과적이에요. 참고: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 영어가 아닌 프롬프트를 추론 전에 체계적으로 영어로 번역하면 여러 태스크와 언어에서 LLM 출력 품질이 향상돼요. 연구자들은 프롬프트를 네 가지 기능적 부분(지시, 맥락, 예시, 출력)으로 분해하고, 특정 구성 요소만 선택적으로 번역하는 것이 전체를 번역하는 것보다 더 효과적일 수 있음을 보여줬어요. 참고: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 벤치마크——29 개 언어로 된 11,829 개의 동일한 질문——에서 영어와 저자원 언어 사이에 최대 24.3% 의 성능 격차가 발견됐어요. 프랑스어와 독일어 같은 잘 지원되는 언어에서도 측정 가능한 성능 저하가 나타나요. 이 격차는 모델의 사전 학습 코퍼스에서 각 언어가 차지하는 비율과 강하게 상관되며, 단순히 모델 크기를 늘리는 것만으로는 해소되지 않아요. 참고: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot prompting——프롬프트 내에 입력/출력 예시를 제공하는 방식——은 LLM 태스크 성능을 극적으로 향상시켜요. 획기적인 GPT-3 논문에서 zero-shot 성능이 모델 크기에 따라 꾸준히 향상되는 반면, few-shot 성능은 *더 빠르게* 증가하여 때로는 파인튜닝된 모델과 경쟁할 수 있는 수준에 도달한다는 것을 보여줬어요. 더 큰 모델은 in-context 예시로부터 학습하는 능력이 더 뛰어나요. 참고: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 구조화되고 잘 설계된 프롬프트는 코드 생성 태스크에서 모호한 지시보다 일관되게 더 나은 성과를 보여요. Chain-of-thought 추론, 역할 부여, 명시적 범위 제약과 같은 기법들이 모두 첫 번째 시도의 정확도를 향상시켜요. 참고: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
