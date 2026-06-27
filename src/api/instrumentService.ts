import { apiClient } from "./axios";
import {
  AnswerKeyDTO,
  AnswerKeyRequest,
  ApiResponse,
  BaremoDTO,
  BaremoRangeDTO,
  BaremoRangeRequest,
  BaremoRequest,
  EstrategiaCalificacionDTO,
  ItemDTO,
  ItemRequest,
  OptionDTO,
  OptionRequest,
  ScoringRuleDTO,
  ScoringRuleRequest,
  SubtestDTO,
  SubtestRequest,
  TestPsicologicoDTO,
  TestRequest,
  VersionRequest,
  VersionTestDTO,
} from "./types";

export type InstrumentVersionDTO = VersionTestDTO & {
  number?: string;
  status?: VersionTestDTO["estado"];
  createdAt?: string;
};

export type { SubtestDTO, ItemDTO };

function data<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export const instrumentService = {
  async getTests(): Promise<TestPsicologicoDTO[]> {
    return data(await apiClient.get<ApiResponse<TestPsicologicoDTO[]>>("/tests"));
  },

  async createTest(request: TestRequest): Promise<TestPsicologicoDTO> {
    return data(await apiClient.post<ApiResponse<TestPsicologicoDTO>>("/tests", request));
  },

  async getVersions(testId: number | string): Promise<InstrumentVersionDTO[]> {
    const versions = data(
      await apiClient.get<ApiResponse<VersionTestDTO[]>>(`/tests/${testId}/versions`),
    );
    return versions.map((version) => ({
      ...version,
      number: version.numeroVersion,
      status: version.estado,
      createdAt: version.creadoEn,
    }));
  },

  async createVersion(testId: number | string, request: VersionRequest): Promise<InstrumentVersionDTO> {
    const version = data(
      await apiClient.post<ApiResponse<VersionTestDTO>>(`/tests/${testId}/versions`, request),
    );
    return { ...version, number: version.numeroVersion, status: version.estado, createdAt: version.creadoEn };
  },

  async updateVersion(versionId: number | string, request: VersionRequest): Promise<InstrumentVersionDTO> {
    const version = data(
      await apiClient.patch<ApiResponse<VersionTestDTO>>(`/test-versions/${versionId}`, request),
    );
    return { ...version, number: version.numeroVersion, status: version.estado, createdAt: version.creadoEn };
  },

  async approveVersion(versionId: number | string): Promise<InstrumentVersionDTO> {
    const version = data(
      await apiClient.post<ApiResponse<VersionTestDTO>>(`/test-versions/${versionId}/approve`),
    );
    return { ...version, number: version.numeroVersion, status: version.estado, createdAt: version.creadoEn };
  },

  async publishVersion(versionId: number | string): Promise<InstrumentVersionDTO> {
    const version = data(
      await apiClient.post<ApiResponse<VersionTestDTO>>(`/test-versions/${versionId}/publish`),
    );
    return { ...version, number: version.numeroVersion, status: version.estado, createdAt: version.creadoEn };
  },

  async getSubtests(versionId: number | string): Promise<SubtestDTO[]> {
    return data(await apiClient.get<ApiResponse<SubtestDTO[]>>(`/test-versions/${versionId}/subtests`));
  },

  async addSubtest(versionId: number | string, request: SubtestRequest): Promise<SubtestDTO> {
    return data(await apiClient.post<ApiResponse<SubtestDTO>>(`/test-versions/${versionId}/subtests`, request));
  },

  async updateSubtest(subtestId: number | string, request: SubtestRequest): Promise<SubtestDTO> {
    return data(await apiClient.patch<ApiResponse<SubtestDTO>>(`/subtests/${subtestId}`, request));
  },

  async getItems(subtestId: string | number): Promise<ItemDTO[]> {
    return data(await apiClient.get<ApiResponse<ItemDTO[]>>(`/subtests/${subtestId}/items`));
  },

  async addItem(subtestId: string | number, request: ItemRequest): Promise<ItemDTO> {
    return data(await apiClient.post<ApiResponse<ItemDTO>>(`/subtests/${subtestId}/items`, request));
  },

  async updateItem(itemId: string | number, request: ItemRequest): Promise<ItemDTO> {
    return data(await apiClient.patch<ApiResponse<ItemDTO>>(`/items/${itemId}`, request));
  },

  async getOptions(itemId: string | number): Promise<OptionDTO[]> {
    return data(await apiClient.get<ApiResponse<OptionDTO[]>>(`/items/${itemId}/options`));
  },

  async addOption(itemId: string | number, request: OptionRequest): Promise<OptionDTO> {
    return data(await apiClient.post<ApiResponse<OptionDTO>>(`/items/${itemId}/options`, request));
  },

  async updateOption(optionId: string | number, request: OptionRequest): Promise<OptionDTO> {
    return data(await apiClient.patch<ApiResponse<OptionDTO>>(`/options/${optionId}`, request));
  },

  async getStrategies(): Promise<EstrategiaCalificacionDTO[]> {
    return data(await apiClient.get<ApiResponse<EstrategiaCalificacionDTO[]>>("/scoring/strategies"));
  },

  async getScoringRules(subtestId: string | number): Promise<ScoringRuleDTO[]> {
    return data(await apiClient.get<ApiResponse<ScoringRuleDTO[]>>(`/subtests/${subtestId}/scoring-rules`));
  },

  async createScoringRule(subtestId: string | number, request: ScoringRuleRequest): Promise<ScoringRuleDTO> {
    return data(await apiClient.post<ApiResponse<ScoringRuleDTO>>(`/subtests/${subtestId}/scoring-rules`, request));
  },

  async updateScoringRule(ruleId: string | number, request: ScoringRuleRequest): Promise<ScoringRuleDTO> {
    return data(await apiClient.patch<ApiResponse<ScoringRuleDTO>>(`/scoring-rules/${ruleId}`, request));
  },

  async getAnswerKey(itemId: string | number): Promise<AnswerKeyDTO | null> {
    return data(await apiClient.get<ApiResponse<AnswerKeyDTO | null>>(`/items/${itemId}/answer-key`));
  },

  async createAnswerKey(itemId: string | number, request: AnswerKeyRequest): Promise<AnswerKeyDTO> {
    return data(await apiClient.post<ApiResponse<AnswerKeyDTO>>(`/items/${itemId}/answer-key`, request));
  },

  async updateAnswerKey(keyId: string | number, request: AnswerKeyRequest): Promise<AnswerKeyDTO> {
    return data(await apiClient.patch<ApiResponse<AnswerKeyDTO>>(`/answer-keys/${keyId}`, request));
  },

  async getBaremos(versionId: string | number): Promise<BaremoDTO[]> {
    return data(await apiClient.get<ApiResponse<BaremoDTO[]>>(`/test-versions/${versionId}/baremos`));
  },

  async createBaremo(request: BaremoRequest): Promise<BaremoDTO> {
    return data(await apiClient.post<ApiResponse<BaremoDTO>>("/baremos", request));
  },

  async updateBaremo(baremoId: string | number, request: BaremoRequest): Promise<BaremoDTO> {
    return data(await apiClient.patch<ApiResponse<BaremoDTO>>(`/baremos/${baremoId}`, request));
  },

  async getBaremoRanges(baremoId: string | number): Promise<BaremoRangeDTO[]> {
    return data(await apiClient.get<ApiResponse<BaremoRangeDTO[]>>(`/baremos/${baremoId}/ranges`));
  },

  async addBaremoRange(baremoId: string | number, request: BaremoRangeRequest): Promise<BaremoRangeDTO> {
    return data(await apiClient.post<ApiResponse<BaremoRangeDTO>>(`/baremos/${baremoId}/ranges`, request));
  },

  async updateBaremoRange(rangeId: string | number, request: BaremoRangeRequest): Promise<BaremoRangeDTO> {
    return data(await apiClient.patch<ApiResponse<BaremoRangeDTO>>(`/baremo-ranges/${rangeId}`, request));
  },

  async uploadImage(
    file: File,
    itemId: string | number,
    order?: number,
    altText?: string,
    role = "ENUNCIADO",
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", file);
    if (order !== undefined) formData.append("order", String(order));
    if (altText !== undefined) formData.append("altText", altText);
    formData.append("role", role);

    return data(
      await apiClient.post<ApiResponse<unknown>>(`/items/${itemId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  async uploadOptionImage(
    file: File,
    optionId: string | number,
    order?: number,
    altText?: string,
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append("file", file);
    if (order !== undefined) formData.append("order", String(order));
    if (altText !== undefined) formData.append("altText", altText);

    return data(
      await apiClient.post<ApiResponse<unknown>>(`/options/${optionId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
};
