# MAPEAMENTO FIEL WEB → MOBILE - MODAL DE ALUNO

## ABA 1: PESSOAL
- Nome Completo (Input text) *obrigatório
- CPF (Input com máscara) *obrigatório
- Data de Nascimento (DatePicker)
- Status (Select: ATIVO, PENDENTE, INATIVO)
- Foto (Upload - não implementar agora)

## ABA 2: CONTATO
- Telefone (Input com máscara)
- WhatsApp (Input com máscara)
- Email (Input email)
- **Endereço:**
  - Rua
  - Número
  - Complemento
  - Bairro
  - Cidade
  - Estado (UF)
  - CEP

## ABA 3: RESPONSÁVEL (só aparece se menor de 18 anos)
- Nome Completo *obrigatório se menor
- CPF (Input com máscara) *obrigatório se menor
- **Grau de Parentesco (SELECT):** *obrigatório se menor
  - PAI
  - MÃE
  - AVÔ/AVÓ
  - TIO/TIA
  - OUTRO
- Telefone
- WhatsApp
- Email
- Checkbox: Responsável Financeiro
- Checkbox: Mesmo endereço do aluno
- **Endereço (se não for mesmo):**
  - Rua, Número, Complemento, Bairro, Cidade, Estado, CEP

## ABA 4: CAPOEIRA
- Graduação Inicial (Select com lista de cordas)
- Data da Graduação (DatePicker)
- **Professor (Select)** - carrega da API /teachers
- **Unidade (Select)** - cascata baseada no professor
- **Turma (Select)** - cascata baseada na unidade
- Data de Matrícula (DatePicker)

## ABA 5: FINANCEIRO
- Mensalidade (Input numérico)
- Dia de Vencimento (Input 1-31)
- Próximo Vencimento (Calculado automaticamente)
- Forma de Pagamento (Input text)
- Situação Financeira (Select: EM_DIA, ATRASADO, ISENTO)

## ABA 6: OBSERVAÇÕES
- Campo de texto livre (textarea)

---

## VALIDAÇÕES IMPORTANTES:
1. Nome e CPF são obrigatórios sempre
2. Se menor de 18 anos:
   - Nome do Responsável obrigatório
   - CPF do Responsável obrigatório
   - Grau de Parentesco obrigatório
3. CPF deve ser validado
4. Telefones devem ter máscara (00) 00000-0000
