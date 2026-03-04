# 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

## 1. Badge de Corda não aparece
**Causa:** Graduações vêm sem o campo `level`
**Solução:** Extrair `level` das notes ou criar campo no banco

## 2. Responsável aparece sempre
**Causa:** Lógica condicional `isMinor` não está sendo aplicada
**Solução:** Envolver seção Responsável em `{isMinor && ...}`

## 3. Falta módulo de Graduações
**Causa:** Não existe tela/aba de Graduações
**Solução:** Criar aba "Graduações" no Acadêmico

## 4. Falta separação Alunos/Professores
**Causa:** Todos na mesma lista
**Solução:** Criar abas no AcademicScreen (Alunos | Professores | Graduações)

## 5. Drawer não funciona
**Causa:** Não foi implementado DrawerNavigator
**Solução:** Criar DrawerNavigator com menu lateral

## 6. Dados incompletos
**Causa:** API não retorna `level` nas graduações
**Solução:** Parsear notes ou ajustar backend

---

## PRIORIDADE DE EXECUÇÃO:

1. **URGENTE:** Responsável condicional (1 linha)
2. **URGENTE:** Drawer Navigator
3. **IMPORTANTE:** Abas no Acadêmico
4. **IMPORTANTE:** Corrigir dados de graduação
